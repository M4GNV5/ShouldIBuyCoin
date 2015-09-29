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
