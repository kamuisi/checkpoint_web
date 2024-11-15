const team = require("../model/team.js");
const flow = require("../model/flow.js");
const teamweb = require("../model/teamweb.js");
const score = require("../model/score.js");
const { response } = require("express");

var that = (module.exports = {
  setupPage: async (req, res, next) => {
    res.render(__basedir + "/views/setup.ejs", {
      maxCheckPoints: process.env.maxCheckPoints,
    });
  },
  leaderBoard: async (req, res, next) => {
    res.render(__basedir + "/views/leaderboard.ejs", {
      maxCheckPoints: process.env.maxCheckPoints,
    });
  },
  // scoreBoard: async (req, res, next) => {
  //   res.render(__basedir + "/views/scoreboard.ejs", {
  //     maxCheckPoints: process.env.maxCheckPoints,
  //   });
  // },
  dualPage: async (req, res, next) => {
    res.render(__basedir + "/views/dual_v3.ejs");
  },
  mainPage: async (req, res, next) => {
    res.render(__basedir + "/views/scoreboard_view_v2.ejs");
  },
  addTeam: async (data) => {
    try {
      await team.create({
        name: data.name,
        group: data.group,
        image_link: data.image_link,
        score: 0,
        numcheckpoint: 0
      });

      console.log({ message: "Add user Successfully" });
    } catch (err) {
      console.log({ error: err });
    }
  },
  deleteTeam: async (name) => {
    team
      .findOneAndDelete({ name: name })
      .then(() => {
        console.log({ message: "Delete user Successfully" });
      })
      .catch((err) => {
        console.log({ error: err });
      });
  },
  getTeam: (callback) => {
    team
      .find()
      .select("name group score numcheckpoint image_link -_id")
      .then((respond) => {
        return callback(respond);
      })
      .catch((err) => {
        console.log({ error: err });
      });
  },
  addFlow: async (data) => {
    try {
      flow.collection.deleteMany();
      const newFlow = new flow({
        flow: data.flow,
        type: data.type,
      });
      await newFlow.save();
      console.log({ message: "Add flow Successfully" });
    } catch (err) {
      console.log({ error: err });
    }
  },
  getLine: (callback) => {
    flow
      .find()
      .then((respond) => {
        // console.log(respond)
        return callback(respond);
      })
      .catch((err) => {
        console.log({ error: err });
      });
  },
  addrecord: async (data) => {
    try {
      await teamweb.create({
        team: data.team,
        dualwith: data.dualwith,
        turn: data.turn,
        time: data.time,
        cp: data.cp,
      });

      console.log({ message: "Add teamweb Successfully !" });
    } catch (err) {
      console.log({ error: err });
    }
  },
  addrecordteam: async (data) => {
    try {
      console.log(data)
      await team
        .findOne({ name: data[0].name })
        .select("name score numcheckpoint -_id")
        .then(async (respond) => {
          let updateData = ({
            score: ((data[0].result == 'w') ? 3 : ((data[0].result == 'l') ? 0 : 1)) + respond.score,
            numcheckpoint: data[0].numcp + respond.numcheckpoint,
          })
          await team.findOneAndUpdate({ name: data[0].name }, { $set: updateData })
          // console.log(respond)
        })
      await team
        .findOne({ name: data[1].name })
        .select("name score numcheckpoint -_id")
        .then(async (respond) => {
          let updateData1 = ({
            score: ((data[1].result == 'w') ? 3 : ((data[1].result == 'l') ? 0 : 1)) + respond.score,
            numcheckpoint: data[1].numcp + respond.numcheckpoint,
          })
          await team.findOneAndUpdate({ name: data[1].name }, { $set: updateData1 })
          console.log(data[1].name)
        })
      console.log({ message: "Add teamweb Successfully !" });
    } catch (err) {
      console.log({ error: err });
    }
  },
  addRecordScore: async (data) => {
    try {
      if (data.flag_change != true) {
        var old_score = await score.findOne({team_name: data.team_name});
        console.log(old_score.team_name);
        var new_score = await score.findOneAndUpdate({ team_name: data.team_name }, { cp: data.cp, time_finish: data.time_finish, score: data.score, outline: data.outline},
          { new: true, upsert: true });
        // console.log(new_score);
      }
      else {
        var new_score = await score.findOneAndUpdate({ team_name: data.team_name }, { cp: data.cp, time_finish: data.time_finish, score: data.score, outline: data.outline},
          { new: true, upsert: true });
      }
    } catch (err) {
      console.log({ error: err });
    }
  },
  getScore: async (data, callback) => {
    try {
      const respond = await score.findOne({ team_name: data.team_name });
      // console.log(respond);
      callback(respond);
    } catch (err) {
      console.log({ error: err });
    }
  },
});
