var express = require("express")
var app = express();
var RiotApi = require("./src/riotApi.js");

var riot = new RiotApi("e5cad4ff-6733-4438-96e4-937e3ad1bcc1");
var regions = ["br", "eune", "euw", "kr", "lan", "las", "na", "oce", "ru", "tr"];

var frontend = require("fs").readFileSync("./src/index.html");

app.get("/", function(req, res)
{
    res.end(frontend);
});

app.use("/static", express.static(__dirname + "/static"));

app.get("/doIt/:region/:summoner", function(req, res)
{
    var region = req.params.region || "na";
    var summoner = req.params.summoner || false;
    var startTime = new Date().getTime();

    if(regions.indexOf(region) == -1 || !summoner)
        return res.end(createError("invalid region"));

    riot.getSummoner(region, summoner, function(err, result)
    {
        if(err)
            return res.end(createError(err));

        var summonerId = result[Object.keys(result)[0]].id;
        if(!summonerId)
            return res.end(createError("invalid summoner name"));

        riot.getGames(region, summonerId, function(err, data)
        {
            if(err)
                return res.end(createError(err));

            var result = [];
            var count = 0;
            nextGame(0);

            function nextGame(index)
            {
                if(count >= 10 || index >= data.matches.length)
                    return end();

                var newIndex;
                for(var i = index; i < data.matches.length; i++)
                {
                    if(data.matches[i].role == "SOLO" || data.matches.role == "DUO_CARRY")
                    {
                        newIndex = i;
                        break;
                    }
                }

                if(typeof newIndex == "undefined")
                    return end();

                var gameId = data.matches[newIndex].matchId;

                riot.getGame(region, gameId, function(err, data)
                {
                    if(err)
                        return res.status(400).end(createError(err));

                    var participantId;
                    for(var i = 0; i < data.participantIdentities.length; i++)
                    {
                        if(data.participantIdentities[i].player.summonerId == summonerId)
                        {
                            participantId = data.participantIdentities[i].participantId;
                            break;
                        }
                    }

                    for(var i = 0; i < data.participants.length; i++)
                    {
                        if(data.participants[i].participantId == participantId)
                        {
                            var stats = data.participants[i].stats;
                            var _result = {};
                            _result.duration = data.matchDuration;
                            _result.minions = stats.minionsKilled;
                            _result.monster = stats.neutralMinionsKilled;
                            result.push(_result);
                            break;
                        }
                    }

                    count++;
                    nextGame(newIndex + 1);
                });
            }

            function end()
            {
                var missedPerMin = 0;
                var avDuration = 0;
                var shouldBuy = 0;
                for(var i = 0; i < result.length; i++)
                {
                    var duration = result[i].duration / 60;
                    var minionsSpawned = (duration - 2) * 10; //a good farm is 10cs/min -> lets say u can actually farm 9cs/min

                    var missed = minionsSpawned - result[i].minions;
                    var possibleGold = missed * 3;

                    if(possibleGold > 365)
                        shouldBuy++;
                    else
                        shouldBuy--;

                    csPerMin += result[i].minions / duration;
                    missedPerMin += missed / duration;
                    avDuration += duration;
                }

                missedPerMin /= result.length;
                avDuration /= result.length;
                var csPerMin = 10 - missedPerMin;

                var message = "";
                if(shouldBuy > 0)
                    message += '<h2 style="color: #5cb85c;">YES</h2>';
                else if(shouldBuy == 0)
                    message += '<h2 style="color: #f0ad4e;">MAYBE</h2>';
                else
                    message += '<h2 style="color: #d9534f;">NO</h2>';

                var goldPerMin = missedPerMin * 3;
                var goldMissed = round(goldPerMin * avDuration);
                message += "<p>You farm an average of " + round(csPerMin) + " minions per minute"
                    + "<br />Assuming you can farm 10 minions per minute you missed an average of " + round(missedPerMin) + " minions per minute"
                    + "<br />An ancient coin would have given you " + round(goldPerMin) + " extra gold per minute"
                    + "<br />With an average game duration of " + round(avDuration) + " minutes you missed " + goldMissed + " gold per game"
                    + "<br />Making a net gold difference of " + round(goldMissed - 365) + " gold per game</p>";

                function round(i)
                {
                    return Math.round(i * 100) / 100;
                }

                res.end(message);
                var time = (new Date().getTime()) - startTime;
                console.log("Finished user " + req.connection.remoteAddress + " in " + round(time / 1000) + " seconds");
            }
        });
    });
});

function createError(err)
{
    return "<h2>" + err.toString() + "</h2>";
}

app.listen(1337);
