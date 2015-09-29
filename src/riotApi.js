var request = require("request");

function api(key)
{
    this.key = key;

    this.requests = [];

    var single = false;

    this.nextRequest = function()
    {
        if(single)
            console.log("omg there are more of me");
        single = true;

        var that = this;
        var req = that.requests[0];
        var url = req[0];
        var cb = function(err, data)
        {
            req[1](err, data);
            single = false;

            that.requests.splice(0, 1);

            if(that.requests.length > 0)
                that.nextRequest();
        }

        url = encodeURI(url);

        doIt();

        function doIt()
        {
            request(url, function (err, res, body)
            {
                if(!err && res.statusCode == 429)
                {
                    var time = parseInt(res.headers["retry-after"]);
                    console.log("rito rate limit for " + time + " seconds");

                    if(time >= 30)
                        return cb("Too many people are using ShouldIBuyCoin at the moment :( please try again in a few minutes");


                    setTimeout(doIt, time * 1000 + 1);
                }
        		else if(err || res.statusCode != 200)
                {
                    var err = err || "Riot server returned status code " + res.statusCode;
        			cb(err);
        		}
                else
                {
                    try
                    {
                        cb(null, JSON.parse(body));
                    }
                    catch (e)
                    {
                        cb(e);
                    }
        		}
        	});
        }
    };
}

api.prototype.makeRequest = function(url, cb)
{
    this.requests.push([url, cb]);

    if(this.requests.length == 1)
        this.nextRequest();
};

api.prototype.getGames = function(region, id, cb)
{
    var url = "https://" + region + ".api.pvp.net/api/lol/" + region + "/v2.2/matchlist/by-summoner/" + id + "?api_key=" + this.key;
    this.makeRequest(url, cb);
};
api.prototype.getGame = function(region, id, cb)
{
    var url = "https://" + region + ".api.pvp.net/api/lol/" + region + "/v2.2/match/" + id + "?api_key=" + this.key;
    this.makeRequest(url, cb);
};
api.prototype.getSummoner = function(region, name, cb)
{
    var url = "https://" + region + ".api.pvp.net/api/lol/" + region + "/v1.4/summoner/by-name/" + name + "?api_key="  + this.key;
    this.makeRequest(url, cb);
};

module.exports = api;
