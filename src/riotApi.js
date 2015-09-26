var request = require("request");

function api(region, key)
{
    this.region = region.toLowerCase();
    this.key = key;
}

api.prototype.makeRequest = function(url, cb)
{
    var that = this;
    url = encodeURI(url);
    request(url, function (err, res, body)
    {
        if(!err && res.statusCode == 429)
        {
            console.log("waiting " + res.headers["retry-after"] + " seconds for the riot api");
            setTimeout(function()
            {
                that.makeRequest(url, cb);
            }, parseInt(res.headers["retry-after"]) * 1000 + 1);
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
};

api.prototype.getChampions = function(cb)
{
    var url = "https://global.api.pvp.net/api/lol/static-data/" + this.region + "/v1.2/champion?api_key=" + this.key;

    this.makeRequest(url, cb);
};
/*api.prototype.getSummonerSpells = function(cb)
{
    var url = "https://global.api.pvp.net/api/lol/static-data/" + this.region + "/v1.2/summoner-spell?api_key=" + this.key;
    this.makeRequest(url, cb);
};*/
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
api.prototype.getSummonerStats = function(region, id, cb)
{
    var season = season || "SEASON2015";
    var url = "https://" + region + ".api.pvp.net/api/lol/" + region + "/v1.3/stats/by-summoner/" + id + "/summary?season=" + season + "&api_key="  + this.key;
    this.makeRequest(url, cb);
};

module.exports = api;
