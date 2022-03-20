# stack æ!
Stack æ is a open source forum exmple built with node.js, using express, mysql and ejs. Front is built using pure html, css and javascript

# features

* login and registration | all acconut are saved into mysql database and all password are hashed.
* creating posts
* viewing posts on main page

# panel features
## for normal users
* changing password
* changing username
* deleteing account
* viewing details

## only for admin:

* ban account
* give mod
* search user
* (on posts delete post and ban user)

# setup 

first thing, run `setup.sql`, copy it to mysql workbench and run. (if you are having any errors run `fix sql errors.sql`)

after that, fill in all the info in `config.json` and run the command: `npm i`.

after that is done you can run either `npm run dev` or `node index.js`, either will work.

after that you can simply use the app.

# to do

i still want to add:
* comment section on posts
* (any ideas you guys have will work)

done
* added profile picture support in picture / gif format
# support

as the app is a private small project, there might be bugs i did not find, if you have ANY bugs, you can submit them on guthub in the issues section.

i will fix them as soon as possible.



# license

no idea what to put here, u can send a pull request if u want, you can edit whatever you want just dont publish anything without any credits.
