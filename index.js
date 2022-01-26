var bodyParser = require('body-parser');
var express = require('express');
var session = require('express-session');
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var randtoken = require('rand-token');
var nodemailer = require("nodemailer")
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/932927535375859764/7kaVjmnGn3T4lvdZG34eq7tnwua5iTVjvq1iwArqpcXFvYtlD1koMlbTXInas33UH2Xz");
hook.setUsername('StackAe');
var app = express();
var port = 80;
var config = require('./config.json');

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));




var service = config.email;
var emailI = config.email_address;
var email_password = config.email_password;

var con = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port
  });


function sendEmail(email, token) {

    var email = email;
    var token = token;

    var mail = nodemailer.createTransport({
        service: service,
        auth: {
            user: emailI, // Your email id
            pass: email_password // Your password
        }
    });

    var mailOptions = {
        from: 'Stack Ae',
        to: email,
        subject: 'Email verification - test',
        html: '<p>You requested for email verification, kindly use this <a href="http://localhost:80/verify-email?token=' + token + '">link</a> to verify your email address</p>'

    };

    mail.sendMail(mailOptions, function(error, info) {
        if (error) {
            return 1
        } else {
            return 0
        }
    });
}





  function generateRandomTableId(length) {
    var result           = '';
    var characters       = '0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }

    con.query('SELECT * FROM tables WHERE Id = ?', [result], function(err, rows, fields) {
        if (err) throw err
        if (rows.length > 0) {
         generateRandomId(length)
        } else {
            return result
        }
    })
   return result;
}




app.set('views', __dirname + '/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.get('/', function(req, res){

    // var getPosts = "SELECT * FROM tables";
    // con.query(getPosts, function(err, result){
    //     if(err) throw err;
    //     var post1T = result[0].rawname;
    //     var post1C = result[0].creator;
    //     var post1U = result[0].url;
    //     var post2T = result[1].rawname;
    //     var post2C = result[1].creator;
    //     var post2U = result[1].url;
    //     var post3T = result[2].rawname;
    //     var post3C = result[2].creator;
    //     var post3U = result[2].url;
    //     console.log(post1T)
    //     res.render('pages/index', {post1T: post1T, post1C: post1C, post1U: post1U, post2T: post2T, post2C: post2C, post2U: post2U, post3T: post3T, post3C: post3C, post3U: post3U});
    // });
    if (req.session.loggedIn) {
        res.render('pages/index', {username: req.session.user});
        console.log(req.session.user)
    } else {
        res.render('pages/index', {username: "guest"});
        console.log(req.session.user)
    }
    });

app.get('/createpost', function(req, res){
    if (req.session.loggedIn) {
        res.render('pages/cp', {msg: ''});
    } else {
        res.render('pages/account/login', {msg: 'please login to create a post'});
    }
});

app.get('/tamplate', function(req, res){
    res.render('pages/tamplate', {title: '', body: ''});
});

app.get('/login', function(req, res){
    res.render('pages/account/login', {msg: ''});
});

app.get('/register', function(req, res){
    res.render('pages/account/register', {msg: ''});
});

app.get('/ver', (req, res) => {
    res.render('pages/index')
})

//get panel from pages/account/panel
app.get('/panel', function(req, res){
    username = req.session.user;
    if(req.session.loggedIn){
    res.render('pages/account/panel', {msg: 'welcome back', username: username});
    } else {
    res.render('pages/account/login', {msg: 'please login first'});
    }
});

app.get('/details', (req, res) => {
    if(req.session.loggedIn){
        var username = req.session.user;
        var email = req.session.email;
        var id = req.session.id;
        var createdAt = req.session.createdAt;
        var updatedAt = req.session.updatedAt;
    res.render('pages/account/details', {username: username, email: email, createdAt: createdAt, updatedAt: updatedAt, id: id});
    } else {
    res.render('pages/account/login', {msg: 'please login first'});
    }
})


//make a 404 page


app.get('/report', function(req, res){
    res.render('pages/report', {msg: ''});
});

app.post('/report', function(req, res){
    if (req.session.loggedIn) {
        var username = req.session.user;
    } else {
        var username = "guest";
    }
    var problem = req.body.report;
    const embed = new MessageBuilder()
.setTitle('Problem reported by ' + username)
.setAuthor(`${username}`, 'https://icon-library.com/images/error-icon-transparent/error-icon-transparent-13.jpg')
.addField('Error:', '```' + problem + '```')
.setColor('#ff3333')
.setTimestamp();
hook.send(embed);
if(req.session.loggedIn){
    res.render('pages/account/panel', {msg: 'problem reported', username: username});
} else {
    res.render('pages/account/login', {msg: 'problem reported'});
}
});


app.post('/register', function(req, res){
    function generateRandomUserId(length) {
        var result           = '';
        var characters       = '0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
       }
       con.query('SELECT * FROM accounts WHERE Id = ?', [result], function(err, rows, fields) {
           if (err) throw err
           if (rows.length > 0) {
            generateRandomId(length)
           } else {
               return result
           }
       })
       return result;
    }

    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    function register(username, password, email) {
        Id = generateRandomUserId(18)
        var salt = bcrypt.genSaltSync(10)
        var hash = bcrypt.hashSync(password, salt)
        var query = "SELECT * FROM accounts WHERE username = '" + username + "' OR email = '" + email + "'"
        con.query(query, (err, result) => {
            if(err) throw err
            if(result.length > 0) {
                res.render('pages/account/register', {msg: 'Username or email already exists'})
            }
            else {
                var query = "INSERT INTO accounts (Id, username, password, email) VALUES ('" + Id + "', '" + username + "', '" + hash + "', '" + email + "')"
                con.query(query, (err, result) => {
                if(err) throw err;
                res.render('pages/account/login', {msg: "account created, please login"})
            })
            }

        })
    }
    register(username, password, email)
})

app.post('/login', (req, res) => {
    var username = req.body.username
    var password = req.body.password

    con.query('SELECT username FROM accounts WHERE username = (?)', [username], (err, results) => {
        if (err) {
            console.log(err)}
        else {
            if (results.length > 0) {
                con.query('SELECT * FROM accounts WHERE username = (?)', [username], (err, results) => {
                    if (err) {
                        console.log(err)}
                    else {
                        if (results[0].verify === "0" || results[0].verify === 0 || results[0].verify === false){
                            if (bcrypt.compareSync(password, results[0].Password)) {
                                res.render('pages/account/ver', {msg: "please verify your email address"})
                            } else {
                                res.render('pages/account/login', {msg:"Username or Password are invalid"})
                            }
                        }
                        else if (results[0].verify === "1" || results[0].verify === 1 || results[0].verify === true){
                            if (bcrypt.compareSync(password, results[0].Password)) {
                                req.session.loggedIn = true;
                            req.session.user = username;
                            req.session.email = results[0].Email;
                            req.session.id = results[0].Id;
                            req.session.createdAt = results[0].creationDate;
                            req.session.updatedAt = results[0].lastUpdated;
                            res.render('pages/account/panel', {msg:"Welcome back!", username: username})
                            }
                            else {
                                res.render('pages/account/login', {msg:"Username or Password are invalid"})
                            }
                            
                            
                        }
                        else {
                            console.log(results[0].verify)
                        }

                    }
                })
            } else {
                res.render('pages/account/login', {msg: "Username or Password is invalid"})
            }
        }
    })



})


app.post('/send-email', function(req, res, next) {

    var email = req.body.email;

    //console.log(sendEmail(email, fullUrl));

    con.query('SELECT * FROM accounts WHERE email ="' + email + '"', function(err, result) {
        if (err) throw err;

        var type = 'success'
        var msg = 'Email already verified'



        if (result.length > 0) {

           var token = randtoken.generate(20);
            var veri = result[0].verify;
           if(veri == 0 ){
             var sent = sendEmail(email, token);
             if (sent != '0') {


                var data = {
                    token: token
                }


                con.query('UPDATE accounts SET ? WHERE email ="' + email + '"', data, function(err, result) {
                    if(err) throw err
                })
                type = 'success';
                msg = 'The verification link has been sent to your email address';
                res.render('pages/account/ver', {msg:msg});

            } else {
                type = 'error';
                msg = 'Something goes to wrong. Please try again';
                res.render('pages/account/ver', {msg:msg});
            }
           }


        } else {
            type = 'error';
            msg = 'The Email is not registered with us';
            res.render('pages/account/ver', {msg:msg});
        }



    });
})

app.get('/verify-email', function(req, res, next) {
    var token = req.query.token;
    con.query('SELECT * FROM accounts WHERE token ="' + token + '"', function(err, result) {
         if (err) throw err;

         var type
         var msg

          if(result[0].verify == 0){
             if (result.length > 0) {

                 //var data = {
                   //  verify: 1
                 //}

                 con.query('UPDATE accounts set verify = true WHERE email ="' + result[0].Email + '"', function(err, result) {
                    if(err) throw err
                   console.log("ver")
                })
                type = 'success';
                msg = 'Your email has been verified';

            } else {
                console.log('2');
                type = 'success';
                msg = 'The email has already verified';
            }
         }else{
            type = 'error';
            msg = 'The email has been already verified';
         }

        req.session.loggedIn = true;
        res.render('pages/account/panel', {msg: msg, username: req.session.user});
     });
 })


app.post('/createpost', function(req, res){
    const title = req.body.title;
    const body = req.body.body;
    const answer = req.body.answer;
    const answerc = req.body.answerc;
    var randomId = generateRandomTableId(9);
    function generateRandomTitleId(title) {
      var length = 9;
      var result           = '';
      var characters       = '0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
        var finalTitle = title + result;

            con.query('SELECT * FROM tables WHERE name = ?', [finalTitle], function(err, rows, resultnn) {
                if (rows.length > 0) {
                    generateRandomTitleId()
                }
                else {
                    return finalTitle
                }
            })
            return finalTitle
    }

    var titleNoSc = title.replace(/[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g, '');
    var titleNoSpaces = titleNoSc.replace(/\s/g, '');
    var idTitle = generateRandomTitleId(titleNoSpaces);
    var url = 'http://localhost/question' + idTitle + '?' + 'id=' + randomId;
    var creator = req.session.user;

    var tableCr = `CREATE TABLE ${idTitle} (title VARCHAR(255), body LONGTEXT, answer LONGTEXT, creator VARCHAR(255), id INT NOT NULL, comment LONGTEXT)`;
    con.query(tableCr)
    var InsertNewTable = `INSERT INTO ${idTitle} (title, body, answer, creator, id) VALUES ('${title}', '${body}', '${answer}', '${creator}', '${randomId}')`;
    con.query(InsertNewTable)
    var InsertTableT = `INSERT INTO tables (name, rawname, creator, id, url) VALUES (?, ?, ?, ?, ?)`;
    con.query(InsertTableT, [idTitle, title, creator, randomId, url])

    console.log("post created named: " + idTitle)
    res.redirect('http://localhost/question/' + idTitle + '?' + 'id=' + randomId);
})

app.get('/question/:idTitle', function(req, res) {
   var id = req.query.id;
   var pageName = req.params.idTitle;

   var lookForTable = `SELECT * FROM tables WHERE id = ?`;
    con.query(lookForTable, [id], function(err, rows, fields) {
        if (err) throw err
        if (rows.length > 0) {
            var lookForTable = `SELECT * FROM ${pageName} WHERE id = ?`;
            con.query(lookForTable, [id], function(err, result) {
                if (err) throw err
                var title = result[0].title;
                var body = result[0].body;
                var answer = result[0].answer;
                var creator = result[0].creator;
                res.render('pages/tamplate', {title: title, body: body, creator: creator, name: pageName, id: id});
            })
        } else {
            res.render('pages/404');
        }
    })

})

app.post('/question/:idTitle/comments', (req, res) => {

    const comment = req.body.comment;

    var insertToDb = `INSERT INTO ${req.params.idTitle} (comment) VALUES (?)`;
    con.query(insertToDb, [comment])


});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
})

app.post('/changePassword', (req, res) => {
    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;
    var confirmPassword = req.body.confirmPassword;
    var user = req.session.user;

    if (newPassword == confirmPassword) {
        con.query('SELECT * FROM accounts WHERE Username = ?', [user], (req, results) => {
            if (bcrypt.compareSync(oldPassword, results[0].Password)) {
                var hash = bcrypt.hashSync(newPassword, 10);
                con.query('UPDATE accounts SET Password = ? WHERE Username = ?', [hash, user]);
                res.render('pages/account/panel', {msg: 'Password changed', username: user});
            }
             else {
                res.render('pages/account/panel/changePassword', {msg: 'Wrong password, please try again'});
            }
        }
    )
    } else {
        res.render('pages/account/panel/changePassword', {msg: 'Passwords do not match'});
    }
})

app.get('/changePassword', (req, res) => {
    if(req.session.loggedIn) {
        res.render('pages/account/panel/changePassword', {msg: ''});
    }
    else {
        res.render('pages/account/login', {msg: 'you must be logged in to change password'});
    }
})


app.post('/changeUsername', (req, res) => {
    var newUser = req.body.newUsername;
    var user = req.session.user;

    
        con.query('SELECT * FROM accounts WHERE Username = ?', [user], (reqs, results) => {
            if (results > 0) {
                res.render('changeUsername', {msg: 'Username is already taken'});
            }
             else {
                con.query('UPDATE accounts SET Username = ? WHERE Username = ?', [newUser, user]);
                req.session.user = newUser;
                res.render('pages/account/panel', {msg: 'Username changed', username: newUser});
            }
        }
    )
})

app.post('/deleteAccount', (req, res) => {
    var user = req.session.user;
    var password = req.body.password;
    con.query('SELECT * FROM accounts WHERE Username = ?', [user], (resq, results) => {
        if (bcrypt.compareSync(password, results[0].Password)) {
            con.query('DELETE FROM accounts WHERE Username = ?', [user]);
            con.query('DELETE FROM tables WHERE creator = ?', [user]);
            req.session.destroy();
            res.render('pages/account/login', {msg: 'Account deleted'});
            res.render('pages/account/ver', {msg: "Account deleted :("})
        } else {
            res.render('pages/account/deleteAccount', {msg:"Password is invalid"})
        }
    })
    
})

app.get('/changeUsername', (req, res) => {
    if(req.session.loggedIn) {
        res.render('pages/account/panel/changeUsername', {msg: ''});
    }
    else {
        res.render('pages/account/login', {msg: 'you must be logged in to change username'});
    }
})

app.get('/deleteAccount', (req, res) => {
    if(req.session.loggedIn) {
        res.render('pages/account/panel/deleteAccount', {msg: ''});
    }
    else {
        res.render('pages/account/login', {msg: 'you must be logged in to delete your account account'});
    }    
});
    

app.get('*', function(req, res){
    res.render('pages/404');
  });

app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`)
  })
