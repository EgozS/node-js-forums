var config = require('./config.json');
var bodyParser = require('body-parser');
var express = require('express');
var session = require('express-session');
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var randtoken = require('rand-token');
var nodemailer = require("nodemailer")
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const multer  = require('multer')
const upload = multer({ dest: './public/data/pfps/' })
const hook = new Webhook(config.discord_webhook);
hook.setUsername('StackAe');
var app = express();
var port = 80;


app.use(session({
	secret: config.sessions_secret,
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
        //edit email properties here:
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


//get landing page
app.get('/', function(req, res){
    if (req.session.loggedIn) {
        con.query('SELECT * FROM accounts WHERE Username ="' + req.session.rawUser + '" OR '+'"' + req.session.user + '"', function(err, result) {
            if (err) throw err
            if(result.length > 0) {
            var banned = result[0].banned;
            if (banned == 1){
                req.session.banned = 1;
                var bannedt = "you were banned by a moderator, if you think this is a mistake please join our discord server and dm a staff member"
                res.render('pages/index', {username: req.session.user, msg: bannedt});
            }
            else if (result[0].staff) {
                req.session.mod == true
                con.query('SELECT * FROM tables', function(err, results) {
                    if (err) throw err
                    res.render('pages/index', {username: req.session.user, msg: "", tables: results});
                })
            }
             else {
                con.query('SELECT * FROM tables', function(err, results) {
                    if (err) throw err
                    res.render('pages/index', {username: req.session.user, msg: "", tables: results});
                })
            }
        }
        else {
            res.render('pages/index', {username: req.session.user, msg: 'error loading up top posts, please try again'});
        }
        })
    }
    else {
        con.query('SELECT * FROM tables', function(err, results) {
            if (err) throw err
            
            res.render('pages/index', {username: 'guest', msg: "", tables: results});
        })
    }
    });

//get creating posts
app.get('/createpost', function(req, res){
    if (req.session.loggedIn) {
        var sql = `SELECT * FROM accounts WHERE Username = ?`;
        con.query(sql, [req.session.user], function(err, result) {
            if (err) throw err;
           var banned = req.session.banned;
            if (banned){
                res.redirect('/');
            } else {
                res.render('pages/cp', {msg: ''});
            }
        })
    }
    else {
        res.render('pages/account/login', {msg: 'please login to create a post'});
    }
});

//get login
app.get('/login', function(req, res){
    if (req.session.loggedIn) {
        var sql = `SELECT * FROM accounts WHERE Username = ?`;
        con.query(sql, [req.session.user], function(err, result) {
            if (err) throw err;
           var banned = req.session.banned;
            if (banned == 1){
                res.redirect('/');
            } else {
                con.query('SELECT * FROM tables', function(err, results) {
                    if (err) throw err
                    res.render('pages/index', {username: req.session.user, msg: 'you are already logged in!', tables: results});
                })
            }
        })
    }
    else {
        res.render('pages/account/login', {msg: ''});
    }
    
});
//get register
app.get('/register', function(req, res){
    if (req.session.loggedIn) {
        var sql = `SELECT * FROM accounts WHERE Username = ?`;
        con.query(sql, [req.session.user], function(err, result) {
            if (err) throw err;
           var banned = req.session.banned;
            if (banned == 1){
                res.redirect('/');
            } else {
                res.render('pages/index', {username: req.session.user, msg: 'you already have an account!'});
            }
        })
    }
    else {
        res.render('pages/account/register', {msg: ''});
    }
});

app.get('/ver', (req, res) => {
    res.redirect('/')
})

//get panel
app.get('/panel', function(req, res){
    var username = req.session.user;
    if (req.session.loggedIn) {
        if(req.session.mod) {
            res.render('pages/account/panelAdmin', {msg: 'welcome back mod', username: username});
        }
        var sql = `SELECT * FROM accounts WHERE Username = ?`;
        con.query(sql, [req.session.user], function(err, result) {
            if (err) throw err;
           var banned = req.session.banned;
            if (banned == 1){
                res.redirect('/');
            } else {
                res.render('pages/account/panel', {msg: 'welcome back', username: username});
            }
        })
    }
    else {
        res.render('pages/account/login', {msg: 'please login first'});
    }

});
//get details
app.get('/details', (req, res) => {
    if (req.session.loggedIn) {
        var sql = `SELECT * FROM accounts WHERE Username = ?`;
        con.query(sql, [req.session.user], function(err, result) {
            if (err) throw err;
           var banned = req.session.banned;
            if (banned == 1){
                res.redirect('/');
            } else {
                var username = req.session.user;
                var email = req.session.email;
                var id = req.session.id;
                var createdAt = req.session.createdAt;
                var updatedAt = req.session.updatedAt;
                res.render('pages/account/details', {username: username, email: email, createdAt: createdAt, updatedAt: updatedAt, id: id});
            }
        })
    }
    else {
        res.render('pages/account/login', {msg: 'please login first'});
    }
})


//get report
app.get('/report', function(req, res){
    res.render('pages/report', {msg: ''});
});
//post report
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
.setColor('#eed202')
.setTimestamp();
hook.send(embed);
if(req.session.loggedIn){
    res.render('pages/account/panel', {msg: 'problem reported', username: username});
} else {
    res.render('pages/account/login', {msg: 'problem reported'});
}
});

//post register
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
    const url = "/profile/" + username + "/";
    function register(username, password, email) {
        Id = generateRandomUserId(18)
        if(password.length < 8){ res.render('pages/account/register', {msg: 'password must be at least 8 characters long'}); }
        var salt = bcrypt.genSaltSync(10)
        var hash = bcrypt.hashSync(password, salt)
        var query = "SELECT * FROM accounts WHERE username = '" + username + "' OR email = '" + email + "'"
        con.query(query, (err, result) => {
            if(err) throw err
            if(result.length > 0) {
                res.render('pages/account/register', {msg: 'Username or email already exists'})
            }
            else {
                var query = "INSERT INTO accounts (Id, username, password, email, url) VALUES ('" + Id + "', '" + username + "', '" + hash + "', '" + email + "', '" + url + "')"
                con.query(query, (err, result) => {
                if(err) throw err;
                res.render('pages/account/login', {msg: "account created, please login"})
            })
            }

        })
    }
    register(username, password, email)
})
//post login
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
                                req.session.email = results[0].email;
                                req.session.id = results[0].Id;
                                req.session.createdAt = results[0].creationDate;
                                req.session.updatedAt = results[0].lastUpdated;
                                con.query('SELECT * FROM accounts WHERE Username ="' + username + '"', function(err, result) {
                                    if (err) throw err;
                                    req.session.mod = result[0].staff;
                                    req.session.banned = result[0].banned;
                                    if(req.session.mod) {
                                        var usernameE = username + ' (Moderator)';
                                        req.session.rawUser = username;
                                        req.session.user = usernameE;
                                        res.redirect('/panel')
                                    }
                                    else {
                                        req.session.user = username;
                                        if (req.session.banned == 0){
                                        res.render('pages/account/panel', {msg:"Welcome back!", username: req.session.user})
                                        } else {
                                            res.redirect('/');
                                        }
                                    }
                                })
                            }
                            else {
                                res.render('pages/account/login', {msg:"Username or Password are invalid"})
                            }
                            
                            
                        }
                        else {
                        }

                    }
                })
            } else {
                res.render('pages/account/login', {msg: "Username or Password is invalid"})
            }
        }
    })



})

//send verification email
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
                })
                type = 'success';
                msg = 'Your email has been verified';

            } else {
            
                type = 'success';
                msg = 'The email has already verified';
            }
         }else{
            type = 'error';
            msg = 'The email has been already verified';
         }

        req.session.loggedIn = true;
        con.query('SELECT * FROM accounts WHERE Username ="' + result[0].Email + '"', function(err, result) {
            if (err) throw err;
        })
        res.render('pages/account/panel', {msg: msg, username: req.session.user});
     });
 })


app.post('/createpost', function(req, res){
    const title = req.body.title;
    const body = req.body.body;
    const answer = req.body.answer;
    const answerc = req.body.answerc;
    var mod = req.session.mod;
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
    var url = 'http://localhost/question/' + idTitle + '?' + 'id=' + randomId + '&' + 'mod=' + mod;
    var creator = req.session.user;

    var tableCr = `CREATE TABLE ${idTitle} (title VARCHAR(255), body LONGTEXT, answer LONGTEXT, creator VARCHAR(255), id INT NOT NULL, comment LONGTEXT)`;
    con.query(tableCr)
    var InsertNewTable = `INSERT INTO ${idTitle} (title, body, answer, creator, id) VALUES ('${title}', '${body}', '${answer}', '${creator}', '${randomId}')`;
    con.query(InsertNewTable)
    var InsertTableT = `INSERT INTO tables (name, rawname, creator, id, url) VALUES (?, ?, ?, ?, ?)`;
    con.query(InsertTableT, [idTitle, title, creator, randomId, url])

    console.log("post created named: " + idTitle)
    
    res.redirect('http://localhost/question/' + idTitle + '?' + 'id=' + randomId + '&' + 'mod=' + mod);
})

app.get('/question/:idTitle', function(req, res) {
   var id = req.query.id;
   var mod = req.query.mod;
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
                if (mod && req.session.mod) {
                    req.session.postId = id
                    req.session.postName = pageName
                    res.render('pages/tamplateMod', {title: title, body: body, creator: creator, name: pageName, id: id});
                }
                else{
                    res.render('pages/tamplate', {title: title, body: body, creator: creator, name: pageName, id: id});
                }
                
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
    var banned = req.session.banned;
    if (banned) {
        res.render('pages/index', {msg: 'huh? whats that? you think you can just logout? funny', username: req.session.user + ' (banned LOL) + ratio'});
    } else {
    req.session.destroy();
    res.redirect('/');
    }
})

app.post('/panel/changePassword', (req, res) => {
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

app.get('/panel/changePassword', (req, res) => {
    if (req.session.loggedIn) {
        var sql = `SELECT * FROM accounts WHERE Username = ?`;
        con.query(sql, [req.session.user], function(err, result) {
            if (err) throw err;
           var banned = req.session.banned;
            if (banned == 1){
                res.redirect('/');
            } else {
                res.render('pages/account/panel/changePassword', {msg: ''});
            }
        })
    }
    else {
        res.render('pages/account/login', {msg: 'you must be logged in to change password'});
    }
})


app.post('/panel/changeUsername', (req, res) => {
    var newUser = req.body.newUsername;
    var user = req.session.user;

    
        con.query('SELECT * FROM accounts WHERE Username = ?', [user], (reqs, results) => {
            if (results > 0) {
                res.render('changeUsername', {msg: 'Username is already taken'});
            }
             else {
                con.query('UPDATE accounts SET Username = ? WHERE Username = ?', [newUser, user]);
                req.session.user = username;
                res.render('pages/account/panel', {msg: 'Username changed', username: newUser});
            }
        }
    )
})

app.post('/panel/deleteAccount', (req, res) => {
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

app.get('/panel/changeUsername', (req, res) => {
    if(req.session.loggedIn) {
        res.render('pages/account/panel/changeUsername', {msg: ''});
    }
    else {
        res.render('pages/account/login', {msg: 'you must be logged in to change username'});
    }
})

app.get('/panel/deleteAccount', (req, res) => {
    if (req.session.loggedIn) {
        var sql = `SELECT * FROM accounts WHERE Username = ?`;
        con.query(sql, [req.session.user], function(err, result) {
            if (err) throw err;
           var banned = req.session.banned;
            if (banned == 1){
                res.redirect('/');
            } else {
                res.render('pages/account/panel/deleteAccount', {msg: ''});
            }
        })
    }
    else {
        res.render('pages/account/login', {msg: 'you must be logged in to delete your account account'});   
    }    
});

app.get('/panelAdmin', (req, res) => {
    if(req.session.loggedIn) {
        if(req.session.mod == true) {
            res.render('pages/account/panelAdmin', {msg: '', username: req.session.user});
        }
        else {
            res.render('pages/account/panel', {msg: 'You must be a moderator to access this page', username: req.session.user});
        }  
    }
    else {
        res.render('pages/account/login', {msg: 'you must be logged in to access this page'});
    }
})

app.post('/deletePost', (req, res) => {
    var id = req.session.postId
    var pageName = req.session.postName
    console.log(id, pageName);
    var lookForTable = `SELECT * FROM tables WHERE id = ?`;
    con.query(lookForTable, [id], function(reqs, results) {
        if (results.length > 0) {
            var removeFromCol = `DELETE FROM tables WHERE id = ?`;
            con.query(removeFromCol, [id]);
            var removePost = `DROP TABLE ${results[0].name}`;
            con.query(removePost);
            res.render('pages/account/panelAdmin', {msg: `Post deleted ${pageName}`, username: req.session.user});
        } else {
            console.log("error?")
            res.render('pages/404');
        }
    }

)
})

app.post('/panelAdmin/banAccountP', (req, res) => {
    var pageName = req.session.postName;
    var sql = `SELECT * FROM ${pageName}`;
    var username = req.session.user;
    con.query(sql, function(reqs, results) {
        if (results.length > 0){
            var creator = results[0].creator;
            var sql = `UPDATE accounts SET banned = 1 WHERE Username = ?`;
            con.query(sql, [creator]);
            const embed = new MessageBuilder()
            .setTitle(creator + ' was banned by ' + username)
            .setAuthor(`${username}`, 'https://cdn.discordapp.com/attachments/801522488689164359/936255701905444924/image_2022-01-27_154506.png')
            .addField('banned for post:', '```' + pageName + '```')
            .setColor('#ff3333')
            .setTimestamp();
            hook.send(embed);
            res.render('pages/account/panelAdmin', {msg: `Account banned ${creator}`, username: req.session.user});
        }
        else {
            res.render('pages/404');
        }
    })
})


app.get('/panelAdmin/banAccount', (req, res) => {
    if(req.session.loggedIn) {
        if(req.session.mod == true) {
            res.render('pages/account/panel/admin/banAccount', {msg: ''});
        }
        else {
            res.render('pages/account/panel', {msg: 'You must be a moderator to access this page'});
        }  
    }
    else {
        res.render('pages/account/login', {msg: 'you must be logged in to access this page'});
    }
});
app.post('/panelAdmin/banAccount', (req, res) => {
    var username = req.session.user;
    var creator = req.body.username;
    var reason = req.body.Reason;
        var sql = `UPDATE accounts SET banned = 1 WHERE Username = ?`;
        con.query(sql, [creator], function(err, result) {
            if (err) {res.render('pages/account/panel/admin/banAccount', {msg: 'Account dose not exist', username: req.session.user});};
                const embed = new MessageBuilder()
            .setTitle(creator + 'was banned by' + username)
            .setAuthor(`${username}`, 'https://cdn.discordapp.com/attachments/801522488689164359/936255701905444924/image_2022-01-27_154506.png')
            .addField('banned for:', '```' + reason + '```')
            .setColor('#ff3333')
            .setTimestamp();
            hook.send(embed);
        res.render('pages/account/panelAdmin', {msg: `${creator} just got banned L`, username: req.session.user});
            
            
                
        });
        
})
app.get('/panelAdmin/giveMod', (req, res) => {
    if(req.session.loggedIn) {
        if(req.session.mod) {
            res.render('pages/account/panel/admin/giveMod', {msg: ''});
        }
        else {
            res.render('pages/account/panel', {msg: 'You must be a moderator to access this page'});
        }  
    }
    else {
        res.render('pages/account/login', {msg: 'you must be logged in to access this page'});
    }
});
app.post('/panelAdmin/giveMod', (req, res) => {
    if(req.session.loggedIn && req.session.mod) {
        var user = req.body.username;
    var password = req.body.password;
    con.query('SELECT * FROM accounts WHERE Username = ?', [req.session.rawUser], (resq, results) => {
        if (results.length > 0) {
        if (bcrypt.compareSync(password, results[0].Password)) {
            var sql = `update accounts SET staff = true WHERE Username = ?`;
            con.query(sql, [user]);
            res.render('pages/account/panelAdmin', {msg: `${user} is now a moderator`, username: req.session.user});
            console.log(user + ' is now a moderator, promoted by' + req.session.user);
        } else {
            res.render('pages/account/panel/admin/giveMod', {msg:"Password is invalid"})
        }
    } else {
        console.log(results)
        console.log(req.session.user)
        res.render('pages/account/panel/admin/giveMod', {msg:"Account does not exist"})
    }
    })
    
    }
    else {
        res.render('pages/account/login', {msg: 'you must be logged in to access this page'});
    }
})

app.get('/panelAdmin/searchUser', (req, res) => {
    if(req.session.loggedIn) {
        if(req.session.mod) {
            res.render('pages/account/panel/admin/searchUser', {msg: ''});
        }
        else {
            res.render('pages/account/panel', {msg: 'You must be a moderator to access this page'});
        }  
    }
    else {
        res.render('pages/account/login', {msg: 'you must be logged in to access this page'});
    }
})
app.get('/panel/userRes/', function(req, res) {
    if(req.session.loggedIn) {
    res.redirect('/panel');
    }
    else if (res.session.mod){
        res.redirect('/panelAdmin');
    }
    else {
        res.redirect('/')
    }
});
app.post('/panelAdmin/searchUser', (req, res) => {
    var user = req.body.username;
    var sql = `SELECT * FROM accounts WHERE Username = ? OR Id = ?`;
    con.query(sql, [user, user], function(err, result) {
        if (result.length > 0) {
            var url = result[0].url;
            var mod = req.session.mod;
            res.redirect(url + '?mod=' + mod);
        }
    })
})

app.get('/profile/:username', function(req, res) {
    if(req.session.loggedIn) {
        if(req.session.user == req.params.username) {
            var owner = true;
        }
        else {
            var owner = false;
        }
    }
    var usernameLong = req.params.username;
    var sql = `SELECT * FROM accounts WHERE Username = ?`;
    var rawUsername = usernameLong.replace(' (Moderator)', '');
    con.query(sql, [rawUsername], function(err, result) {
        if (err) throw err;
        if (result.length > 0) {
            var Username = result[0].Username;
            var mod = req.query.mod;
            var bio = result[0].bio;
            var creationDate = result[0].creationDate;
            var email = result[0].email;
            var image = result[0].image;
            var mods = req.session.mod;
            if (image == null || image == "" || image == undefined) {
                image = 'https://i.pinimg.com/550x/18/b9/ff/18b9ffb2a8a791d50213a9d595c4dd52.jpg';
            }
            msg = "";
            if (result[0].banned == 1) {
                var msg = "account is banned!";
            }
            const obj = {username: Username, bio: bio, creationDate: creationDate, email: email, image: image, msg: msg, owner: owner, userUrl: usernameLong};
            con.query('SELECT * FROM tables WHERE creator = ?', [usernameLong], function(err, resultp) {
            if(mod && mods) {
                res.render('pages/account/panel/profile/profileMod', {obj: obj, tables: resultp});
            }
            else {
                res.render('pages/account/panel/profile/profile', {obj: obj, tables: resultp});
            }
            });
            
        }
        else {
            res.redirect('/404');
        }
    })
})


app.post('/profile/:username/edit', function(req, res) {
    var profileName = req.params.username;
    var rawUsername = profileName.replace(' (Moderator)', '');
    var sql = `SELECT * FROM accounts WHERE Username = ?`;
    if(req.session.loggedIn) {
        if(req.session.user == req.params.username) {
            var owner = true;
        }
        else {
            var owner = false;
        }
    }
    if(req.session.loggedIn) {
        if(req.session.user == req.params.username) {
            con.query(sql, [rawUsername], function(err, result) {
                if (err) throw err;
                if (result.length > 0) {
                    var Username = result[0].Username;
                    var bio = result[0].Bio;
                    var creationDate = result[0].creationDate;
                    var email = result[0].email;
                    var image = result[0].image;
                    msg = "";
                    if (result[0].banned == 1) {
                        var msg = "account is banned!";
                    }
                    const obj = {username: Username, bio: bio, creationDate: creationDate, email: email, image: image, msg: msg, owner: owner, userUrl: profileName};
                    res.render('pages/account/panel/profile/edit', {obj: obj});
                }
                else {
                    res.redirect('/404');
                }
            })            
        }
        else {
            console.log('you are not the owner of this profile')
            res.redirect('/404');
        }
    }
    else {
        res.redirect('/login');
    }
})

app.post('/profile/:username/saveChanges', upload.single('ProfileImage'), function(req, res) {
    var profileName = req.params.username;
    var rawUsername = profileName.replace(' (Moderator)', '');
    var newName = req.body.newUsername;
    var bio = req.body.newBio;
    var img = req.file;
    
    var sql = `SELECT * FROM accounts WHERE Username = ?`;
    con.query(sql, [newName], function(err, result) {
        console.log(result)
        if (err) throw err;
        if (result.length > 0) {
            console.log('a')
            var obj = {msg: 'Username already taken'};
            res.render('pages/account/panel/profile/edit', {obj: obj});
            return;
        }
    });
    if (img = undefined || img == null) {
        img = 'https://i.pinimg.com/564x/18/b9/ff/18b9ffb2a8a791d50213a9d595c4dd52.jpg';
    }
    else {
        img = "../../../../../data\\pfps\\" + req.file.filename;
    }
    if(newName == "" || newName == undefined) {
        newName = rawUsername;
    }
    if(bio == "" || bio == undefined) {
        bio = req.session.bio;
    }
    req.session.bio = bio;
    if (rawUsername == req.session.rawUser) {
        if (img == undefined) {
            var sql = `UPDATE accounts SET Username = ?, Bio = ? WHERE Username = ?`;
            con.query(sql, [newName, bio, rawUsername], function(err, result) {
                req.session.user = newName;
                if (err) throw err;
                res.redirect('/profile/' + newName);
            })
        }
        else {
            var sql = `UPDATE accounts SET Username = ?, Bio = ?, image = ? WHERE Username = ?`;
            con.query(sql, [newName, bio, img, rawUsername], function(err, result) {
                if (err) throw err;
                req.session.user = newName;
                res.redirect('/profile/' + newName);
                return;
            })
        }
    }
    else {
        res.redirect('/login');
    }

})

app.get('*', function(req, res){
    res.render('pages/404');
  });

app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`)
  });