/*
Copyright (C) 2011 by Max Software Ltd

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var TDTwitterStream = require('TDTwitterStream');
var tds = new TDTwitterStream();

tds

.on("error", function(d){ 
	// Email yourself with the error etc
	console.log(d); 
})

.on("control", function(url){ 
	// Allows for modifying a stream's content without reconnection
	// Currently inactive, see https://dev.twitter.com/docs/streaming-api/site-streams (Search "control_uri")
	console.log("Control URL: " + url); 
})

.on("connect", function(recipient, friends){ 
	// When an account has connected, you get back an array of the user ID's of the people that person is following
	console.log("Connection established. Following " + friends.length + " people"); 
})

.on("tweet", function(recipient, tweet, user){
	// Fired whenever a tweet is encountered. This includes retweets
	console.log("[Tweet]: {"+tweet.user.screen_name+"}" + tweet.text);
})

.on("location", function(recipient, tweet, location){
	// Fired whenever a tweet contains a location
	console.log("[Location]:" + location.full_name);
})

.on("user", function(recipient, user){
	// Fired every time a new user is detected
	// This does not include mentions, as mentions don't send back a full user object
	console.log("[User]: " + user.screen_name);
})

.on("retweet_by_following", function(recipient, tweet, retweet){
	// A retweet by someone you're following
	console.log("[Retweet]: (By @"+retweet.user.screen_name+") {@"+tweet.user.screen_name+"} " + tweet.text);
})

.on("retweet_of_me", function(recipient, tweet, retweet){
	// When someone retweets you (whether you're following them or not)
	console.log("[RT Of Me]: (By @"+retweet.user.screen_name+") {@"+tweet.user.screen_name+"} " + tweet.text);
})

.on("retweet_by_me", function(recipient, tweet, retweet){
	// When you retweet someone
	console.log("[RT By Me]: (By @"+retweet.user.screen_name+") {@"+tweet.user.screen_name+"} " + tweet.text);
})

.on("tweet_deleted", function(recipient, user_id, tweet_id){
	// When someone deleted a tweet
	console.log("[Deletion]: " + tweet_id + " by " + user_id);
})

.on("mention", function(recipient, tweet, user_id, user_screen_name){
	// Whenever an @mention is detected in a tweet (not necessarily an in_reply_to tweet)
	// If someone mentions you but you don't follow them, this event is still fired
	console.log("[Mention]: (" + user_screen_name + ") mentioned by (" + tweet.user.screen_name + ")");
})

.on("own_tweet", function(recipient, tweet){
	// Fired whenever you tweet something
	console.log("[I Tweeted]: " + tweet.text);
})



.on("url", function(recipient, tweet, tco, display, expanded){
	// Whenever a URL is detected.
	// "expanded" is the tweet as it was given to twitter. Not ecessarily the final endpoint
	console.log("[Link] {"+tco+"}: " + expanded + " ("+display+")");
})

.on("hashtag", function(recipient, tweet, hashtag){
	// Gives you the hashtag text whenever it encounters a hashtag. 
	console.log("[Hashtag]: " + hashtag);
})




.on("favourite", function(recipient, tweet, tweeter, favouriter){
	// Fired when "recipient" favourites a tweet
	console.log("[Favourited]: {"+tweeter.screen_name+"}" + tweet.text + " favourited by (" + favouriter.screen_name +")");
})

.on("unfavourite", function(recipient, tweet, tweeter, favouriter){
	// Fired when "recipient" unfavourites a tweet
	console.log("[Unfavourited]: {"+tweeter.screen_name+"}" + tweet.text + " unfavourited by (" + favouriter.screen_name +")");
})

.on("favourite_me", function(recipient, tweet, tweeter, favouriter){
	// Someone favourited "recipient"'s tweet
	console.log("[Favourited My Tweet]: {"+tweeter.screen_name+"}" + tweet.text + " favourited by (" + favouriter.screen_name +")");
})

.on("unfavourite_me", function(recipient, tweet, tweeter, favouriter){
	// Someone unfavourited "recipient"'s tweet
	console.log("[Unfavourited My Tweet]: {"+tweeter.screen_name+"}" + tweet.text + " unfavourited by (" + favouriter.screen_name +")");
})



.on("follow", function(recipient, followed, follower){
	// Fired on every follow event encountered (Currently whenever recipient follows someone or is followed)
	console.log("[Follow]: (" + followed.screen_name + ") followed by " + follower.screen_name);
})

.on("follow_me", function(recipient, followed, follower){
	// When "recipient" is followed
	console.log("[Someone Followed Me]: (" + followed.screen_name + ") followed by " + follower.screen_name);
})

.on("own_follow", function(recipient, followed, follower){
	// When "recipient" follows someone
	console.log("[I Followed]: " + followed.screen_name + " followed by " + follower.screen_name);
})

.on("unfollow", function(recipient, followed, follower){
	// Same as follow, but for unfollow
	console.log("[Unfollow]: " + followed.screen_name + " unfollowed by " + follower.screen_name);
})

.on("own_unfollow", function(recipient, followed, follower){
	// When "recipient" unfollows someone
	console.log("[I Unfollowed]: " + followed.screen_name + " unfollowed by " + follower.screen_name);
})



.on("user_profile", function(recipient, profile){
	// When a user's profile is updated'
	console.log("[Profile Updated]: " + profile.screen_name);
})



.on("block", function(recipient, blocked, blocker){
	// When a user is blocked. (NB: Blocking also triggers an unfollow event)
	console.log("[Block]: " + blocked.screen_name + " blocked by " + blocker.screen_name);
})
.on("block_me", function(recipient, blocked, blocker){
	// When "recipient" is blocked
	console.log("[Someone Blocked Me]: " + blocked.screen_name + " blocked by " + blocker.screen_name);
})
.on("own_block", function(recipient, blocked, blocker){
	// When "recipient" blocks someone
	console.log("[I Blocked Someone]: " + blocked.screen_name + " blocked by " + blocker.screen_name);
})
.on("unblock", function(recipient, blocked, blocker){
	// When a user is unblocked. (Does not trigger a follow event)
	console.log("[Unblock]: " + blocked.screen_name + " unblocked by " + blocker.screen_name);
})
.on("unblock_me", function(recipient, blocked, blocker){
	// When "recipient" is unblocked
	console.log("[Someone Unblocked Me]: " + blocked.screen_name + " unblocked by " + blocker.screen_name);
})
.on("own_unblock", function(recipient, blocked, blocker){
	// When "recipient" unblocks somenoe
	console.log("[I Unblocked Someone]: " + blocked.screen_name + " unblocked by " + blocker.screen_name);
})




.on("direct_message", function(recipient, message, sender, target){
	// When a DM is sent or receieved by "recipient"
	console.log("[DM]: From " + sender.screen_name + " to " + target.screen_name + " ["+message.text+"]");
})
.on("direct_message_deleted", function(recipient, user_id, message_id){
	// When a DM is deleted
	console.log("[DM Deleted]: " + message_id + " by " + user_id);
})



.on("list_created", function(recipient, list, user){
	// List created by "recipient". Fired when sitestreams is following "recipient"
	console.log("[List Created]: " + list.name + " by " + user.screen_name);
})

.on("list_updated", function(recipient, list, user){
	// List updated by "recipient". Fired when sitestreams is following "recipient"
	console.log("[List Updated]: " + list.name + " by " + user.screen_name);
})

.on("list_destroyed", function(recipient, list, user){
	// List destroyed by "recipient". Fired when sitestreams is following "recipient"
	console.log("[List Deleted]: " + list.name + " by " + user.screen_name);
})

.on("list_member_added", function(recipient, list, added, user){
	// List member added. Fired when list owner or "added" is "recipient"
	console.log("[List User Added]: "+added.screen_name+" to " + list.name + " by " + user.screen_name);
})

.on("list_member_removed", function(recipient, list, added, user){
	// List member removed. Fired when list owner or "added" is "recipient"
	console.log("[List User Removed]: "+added.screen_name+" to " + list.name + " by " + user.screen_name);
})


;





tds.set_options({
	"auth": {
		"consumer_key": "YOUR-KEY",
	    "consumer_secret": "YOUR-SECRET",
	    "access_token_key": "ACCESS-TOKEN",
	    "access_token_secret": "ACCESS-TOKEN-SECRET",	
	},
	"follow": [], // Array of ID's to follow. Must have authorised application
	//"replies": "all" // This shows *all* tweets to and from anyone that you're following. High volume.
});

tds.run();
