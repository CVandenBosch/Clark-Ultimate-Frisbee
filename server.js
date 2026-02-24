//npm i express body-parser mongoose
//npm i express-session passport passport-local passport-local-mongoose
require('dotenv').config();
const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
//Add passport sessions
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose').default;
// --- GCS SETUP ---
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');

// Connect to Google Cloud
const storage = new Storage({ keyFilename: 'gcs-key.json' });
const bucket = storage.bucket('hightide-images'); // REPLACE WITH YOUR BUCKET NAME

// Configure Multer (The middleman that holds the file briefly)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit (just in case)
});

//Configure body-parser and set static dir path.
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.hostname === 'wtkbwebsite.ue.r.appspot.com') {
    return res.redirect(301, 'https://clarkultimate.com' + req.originalUrl);
  }
  next();
});


//Setup URI
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

//Authorized User Information:
//username:authuser@coolness.com
//password:test

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

app.get("/donate", function (req, res) {
    res.sendFile(__dirname + "/public/donate.html");
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


const PORT = process.env.PORT || 8080;  // Must use process.env.PORT for App Engine

app.listen(PORT, () => {
  console.log(`server started at ${PORT}`);
});

// ======================================
// HIGH TIDE BELOW THIS POINT
// ======================================
const path = require('path');

// 1. Auth Logic: Sets session variable if password is correct
app.post('/api/hightide-auth', (req, res) => {
    const { password } = req.body;
    // You can change this password to whatever you like
    if (password?.toLowerCase() === "buzz") {
        req.session.hightideUnlocked = true;
        res.status(200).json({ message: "Unlocked" });
    } else {
        res.status(401).json({ message: "Forbidden" });
    }
});

// 2. Middleware: Ensures user has unlocked the hive via the password prompt
function protectHighTide(req, res, next) {
    if (req.session && req.session.hightideUnlocked) {
        return next();
    }
    res.redirect('/');
}

// ======================================
// HIGH TIDE - MODELS & DATA
// ======================================
const DEADLINE = new Date('2026-03-06T23:59:59');

const schmeckleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, lowercase: true },
    balance: { type: Number, default: 0 },
    initialAmount: { type: Number, default: 0 }
});
const Schmeckle = mongoose.model('Schmeckle', schmeckleSchema);

const transactionSchema = new mongoose.Schema({
    sender: { type: String, lowercase: true },
    receiver: { type: String, lowercase: true },
    amount: Number,
    reason: String,
    photoUrl: String, 
    timestamp: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// ======================================
// HIGH TIDE - PAGE ROUTES
// ======================================

app.get('/highTide', protectHighTide, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'highTide', 'index.html'));
});

app.get('/highTide/transactions', protectHighTide, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'highTide', 'transactions.html'));
});

app.get('/highTide/user_detail', protectHighTide, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'highTide', 'user_detail.html'));
});

// ======================================
// HIGH TIDE - API ROUTES
// ======================================

app.get('/highTide/api/leaderboard', protectHighTide, async (req, res) => {
    try {
        const balanceDocs = await Schmeckle.find({}).lean();
        const transactions = await Transaction.find({}).sort({ timestamp: -1 }).lean();

        let leaderboard = balanceDocs.map(doc => {
            // Find their last transaction for tie-breaking
            const lastTx = transactions.find(t => 
                t.sender === doc.name || t.receiver === doc.name
            );

            return {
                name: doc.name,
                balance: doc.balance,
                netChange: doc.balance - (doc.initialAmount || 0),
                lastChange: lastTx ? new Date(lastTx.timestamp) : new Date(0)
            };
        });

        leaderboard.sort((a, b) => {
            if (b.balance !== a.balance) return b.balance - a.balance;
            return a.lastChange - b.lastChange; 
        });

        const showForm = new Date() < DEADLINE;
        const winner = leaderboard.length > 0 ? leaderboard[0].name : null;

        res.json({ leaderboard, showForm, winner });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/highTide/update_schmeckles', protectHighTide, upload.single('photo'), async (req, res) => {
    if (new Date() > DEADLINE) return res.status(403).json({ error: 'deadline' });
    
    const person1 = req.body.person1?.toLowerCase().trim();
    const person2 = req.body.person2?.toLowerCase().trim();
    const amount = parseInt(req.body.amount);
    const reason = req.body.reason?.trim();

    if (!person1 || !person2 || isNaN(amount) || amount <= 0 || person1 === person2) {
        return res.status(400).json({ error: 'invalid_input' });
    }

    if (!req.file) return res.status(400).json({ error: 'no_proof_provided' });

    try {
        const sender = await Schmeckle.findOne({ name: person1 });
        const receiver = await Schmeckle.findOne({ name: person2 });

        if (!sender || !receiver) return res.status(404).json({ error: 'user_not_found' });
        
        // Remove this if you want to allow negative balances/debt
        if (sender.balance < amount) return res.status(400).json({ error: 'insufficient_funds' });

        // 1. Upload to GCS first
        const blob = bucket.file(`${Date.now()}_${req.file.originalname}`);
        const blobStream = blob.createWriteStream({ resumable: false });

        blobStream.on('error', err => {
            console.error(err);
            res.status(500).json({ error: 'server_error' });
        });

        blobStream.on('finish', async () => {
            const photoUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

            // 2. ONLY update the database once the photo is safely stored
            sender.balance -= amount;
            receiver.balance += amount;
            
            await sender.save();
            await receiver.save();

            const newTx = new Transaction({ 
                sender: person1, 
                receiver: person2, 
                amount, 
                reason, 
                photoUrl,
                timestamp: new Date()
            });
            await newTx.save();

            res.json({ success: true });
        });

        blobStream.end(req.file.buffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
});

app.get('/highTide/api/transactions', protectHighTide, async (req, res) => {
    try {
        const transactions = await Transaction.find({}).sort({ timestamp: -1 });
        res.json({ transactions });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/highTide/api/user/:name', protectHighTide, async (req, res) => {
    const name = req.params.name.toLowerCase();
    try {
        const transactions = await Transaction.find({
            $or: [{ sender: name }, { receiver: name }]
        }).sort({ timestamp: -1 });
        res.json({ transactions, name });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ======================================
// HIGH TIDE - SEED ROUTE (Visit once to setup)
// ======================================
// app.get('/highTide/seed', async (req, res) => {
// const tens = ["ada", "ben", "cassius", "charlie", "chris", "duncan", "henry", "JD", "kane", "shosh", "silas", "simone", "sophie", "ty", "zayne"];
// const zeros = ["amelia", "ari", "arpi", "cami", "cora", "daniel", "dylan", "ethmi", "evie", "grey", "jason", "jasper", "kass", "lola", "marco", "nick", "noah", "oscar", "suji", "van"];

//     try {
//         await Schmeckle.deleteMany({});
//         const entries = [];
//         tens.forEach(n => entries.push({ name: n.toLowerCase(), balance: 10, initialAmount: 10 }));
//         zeros.forEach(n => entries.push({ name: n.toLowerCase(), balance: 0, initialAmount: 0 }));
//         await Schmeckle.insertMany(entries);
//         res.send("<h1>Hive Seeded!</h1><p>Added " + entries.length + " bees.</p><a href='/'>Go Home</a>");
//     } catch (err) {
//         res.status(500).send("Seed error: " + err.message);
//     }
// });