//npm i express body-parser mongoose
//npm i express-session passport passport-local passport-local-mongoose
const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

//Configure body-parser and set static dir path.
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Setup URI
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/clark-ultimate';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret_for_local',
  resave: false,
  saveUninitialized: false
}));

//Authorized User Information:
//username:authuser@coolness.com
//password:test

//Add passport sessions
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose').default;

//Initialize passport
app.use(passport.initialize());
app.use(passport.session());


// createTournament will ask for everything except player and games, players will come from
// tournamentForm and games will come from createGames, which will be routed to if
// createTournament is submitted for a past date
// if a tourtament is made, then it passes, add games button will appear on it
const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    dateStart: {
        type: Date,
        required: true,
    },
    dateEnd: {
        type: Date,
    },
    address: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["heart", "joan", "mixed"],
        required: true
    },
    games: [{
        opposingTeamName: {
            type: String,
            required: true
        },
        clarkScore: {
            type: Number,
            required: true
        },
        opposingTeamScore: {
            type: Number,
            required: true
        }
    }],
    players: [{
        name: {
            type: String,
            required: true
        },
        attending: {
            type: Boolean,
            required: true
        },
        isHeart: {
            type: Boolean,
            required: true
        },
        canDrive: {
            type: Boolean,
            required: true
        },
        numSpots: {
            type: Number,
            required: function () {
                return this.canDrive === true;
            }
        },
    }]
})

const Tournament = mongoose.model('Tournament', tournamentSchema);

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        minLength: 3
    },
    fullname: {
        type: String,
        required: true
    },
    security_level: {
        type: Number,
        required: true
    }
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).send({ message: "Unauthorized" });
}


app.listen(3000, function () {
    console.log("server started at 3000");
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/public/home.html");
});

app.get('/schedule', function (req, res) {
    res.sendFile(__dirname + "/public/schedule.html");
});

app.get('/tournamentList', function (req, res) {
    res.sendFile(__dirname + "/public/tournamentList.html");
});

app.get("/history", function (req, res) {
    res.sendFile(__dirname + "/public/history.html");
})

app.get("/get-all-tournaments", function (req, res) {
    Tournament.find().then(tournaments => {
        res.send({
            "message": "success",
            "data": tournaments
        })
    }).catch(err => {
        res.send({
            "message": "error",
            "data": []
        })
    });
});

app.get('/get-tournament-by-id', function (req, res) {
    Tournament.find({'_id': req.query.tournament_id})
        .then(tournaments => {
            res.send({
                'message': 'success',
                'data': tournaments[0]
            })
        }).catch(err => {
        res.send({
            'message': 'error',
            'data': {}
        })
    })
});

// app.get('/get-tournaments-by-filters', function(req, res) {
//     let sk=req.query.search_key;
//     let type = req.query.type;
//     Tournament.find({
//             ...(type !== "all" && { type }),
//             $or: [
//                 {name: {$regex:sk, $options: 'i'}},
//             ]
//     }).then(tournaments=>{
//         res.send({"message":"success", "data":tournaments});
//     }).catch(err=>{
//         res.send({"message":err.message});
//     })
// });

app.get('/get-sorted-tournaments', function(req, res) {
    let sk = req.query.search_key;
    let type = req.query.type;
    let order = req.query.sortOrder === "asc" ? 1 : -1;

    Tournament.find({
        ...(type !== "all" && { type }),
        $or: [
            { name: { $regex: sk, $options: 'i' } },
        ]
    })
        .sort({ dateStart: order })
        .then(tournaments => {
            res.send({ message: "success", data: tournaments });
        })
        .catch(err => {
            res.send({ message: err.message });
        });
});


app.get('/tournamentSignUp', function (req, res) {
    res.sendFile(__dirname + "/public/tournamentSignUp.html");
});

app.post('/tournamentSignUp', async (req, res) => {
    const {
        tournament_id,
        name,
        attending,
        isHeart,
        canDrive,
        numSpots
    } = req.body;

    const attendingBool = attending === "true";
    const isHeartBool = isHeart === "true";
    const canDriveBool = canDrive === "true";
    const numSpotsNum = canDriveBool ? Number(numSpots || 0) : undefined;

    // Update tournament by pushing new player
    await Tournament.findByIdAndUpdate(
        tournament_id,
        {
            $push: {
                players: {
                    name,
                    attending: attendingBool,
                    isHeart: isHeartBool,
                    canDrive: canDriveBool,
                    numSpots: numSpotsNum
                }
            }
        }
    );

    // Redirect back to tournament list after successful signup
    res.redirect('/tournamentList');
});

app.get("/tournamentResults", function (req, res) {
    res.sendFile(__dirname + "/public/tournamentResults.html");
})

app.get("/tournamentDetails", function (req, res) {
    res.sendFile(__dirname + "/public/tournamentDetails.html");
})

app.get("/createTournament", function (req, res){
    //A page can be viewed only after login
    //res.sendFile(__dirname + "/public/movie_edit.html");
    if (req.isAuthenticated()){
        res.sendFile(__dirname + "/src/createTournament.html");
    }else{
        res.redirect("/login?redirect=/createTournament");
    }
});

app.post('/createTournament', function (req, res) {
    //add tournament to db
    const tournament = new Tournament({
        name: req.body.name,
        dateStart: req.body.dateStart,
        dateEnd: req.body.dateEnd || null,
        address: req.body.address,
        type: req.body.type,
        games: [],
        players: []
    });
    tournament.save();

    // Determine if the tournament is in the past
    const now = new Date();
    const endDate = tournament.dateEnd ? new Date(tournament.dateEnd) : new Date(tournament.dateStart);

    const isOld = now > endDate;

    if (isOld) {
        // Go add games immediately
        return res.redirect(`/addGames?tournament_id=${tournament._id}`);
    }

    // Otherwise, go to tournament list
    return res.redirect("/tournamentList");
})

app.get("/addGames", function (req, res){
    const tournament_id = req.query.tournament_id;
    if (req.isAuthenticated()){
        res.sendFile(__dirname + "/src/addGames.html");
    }else{
        res.redirect("/login?redirect=/addGames?tournament_id=" + tournament_id);
    }
});

app.post('/addGames', express.json(), async (req, res) => {
    const { tournament_id, games } = req.body;

    const tournament = await Tournament.findById(tournament_id);
    if (!tournament) return res.status(404).send({ message: 'Tournament not found' });

    tournament.games.push(...games);
    await tournament.save();

    res.send({ message: 'success', data: tournament });
});

app.get('/editTournamentDetails', function (req, res) {
    const tournament_id = req.query.tournament_id;
    if (req.isAuthenticated()) {
        res.sendFile(__dirname + "/public/tournamentDetails.html");
    } else {
        res.redirect("/login?redirect=/editTournamentDetails?tournament_id=" + tournament_id);
    }
})


app.get('/editSchedule', function (req, res) {
    if (req.isAuthenticated()) {
        res.sendFile(__dirname + "/src/editSchedule.html");
    } else {
        res.redirect("/login?redirect=/editSchedule");
    }
});

const scheduleSchema = {
    day: String,
    time: String,
    location : String,
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

app.get("/get-schedule", function (req, res) {
    Schedule.find().then(practices => {
        res.send({
            'message' : 'success',
            'data' : practices
        });
    }).catch(err => {
        res.send({
            'message' : 'error',
            'data' : []
        });
    });
});

app.post('/updateSchedule', function (req, res) {
    const practices = req.body.practices;
    if (!practices || !Array.isArray(practices)) {
        return res.status(400).send({ message: 'error', data: 'Invalid data'});
    }

    if (practices.length === 0) {
        return res.status(400).json({ message: 'error', data: 'No practices provided' });
    }

    Schedule.deleteMany({})
        .then(() => {
            console.log('Deleted all existing practices');
            return Schedule.insertMany(practices);
    })
    .then(result => {
        console.log('Saved new practices:', result);
        res.send({
            message : 'success',
            data : result
        });
    })
    .catch(err => {
        console.error('Error updating schedule', err);
        res.status(500).json({
            message: 'error',
            data: err.message || 'Database error'
        });
    });
});

app.get('/login', (req, res) => {
    // const redirectTo = req.query.redirect || '/';
    // if (req.query.error) {
    //     res.redirect("/login.html?error=" + req.query.error);
    // } else {
    //     res.render('login', { redirectTo });
    // }
    res.sendFile(__dirname + "/public/login.html");
});

app.post('/login', (req, res) => {
    const newUser = new User({
        username: req.body.username,
        password: req.body.password
    });
    const redirectTo = req.body.redirectTo || '/';
    req.login(newUser, function (err) {
        if (err) {
            console.log(err.message);
            res.redirect('/login?error=Invalid username or password&redirect=' + encodeURIComponent(redirectTo));
        } else {
            const authenticate = passport.authenticate('local', {
                successRedirect: redirectTo,
                failureRedirect: '/login?error=Username or password do not match&redirect=' + encodeURIComponent(redirectTo)
            });
            authenticate(req, res);
        }
    });
});

app.get('/get-current-user', function (req, res) {
    if (req.isAuthenticated()) {
        res.send({
            message:"success",
            data:req.user
        })
    } else {
        res.send({
            message:"No user logged in",
            data: {}
        })
    }
});

app.post('/remove-player-from-tournament', ensureAuthenticated, async (req, res) => {
    const { tournamentId, playerId } = req.body;

    try {
        await Tournament.updateOne(
            { _id: tournamentId },
            { $pull: { players: { _id: playerId } } }
        );

        res.send({ message: "success" });
    } catch (err) {
        res.status(500).send({ message: "error", error: err.message });
    }
});
