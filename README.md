# Swiss Natural Danger Alert Bot

A Mattermost bot to send alert about natural dangers.

## Setup
 -  Find out your sector code (see below)
 -  Create a bot account for your bot in Mattermost, and invite it to the channel that should receive notifications
 -  Edit the file `config/default.json` and put in your base Mattermost URL, the bot access token that was given
    to you by Mattermost when creating the bot account, the channel ID, and the sector code.
 -  Run.


## Finding your sector code

Visit the following URL, replacing the two digits at the end with the first two digits of your postal code.

For instance, if you live in Fribourg City (1700), go to 

`https://www.natural-hazards.ch/etc.clientlibs/internet/clientlibs/ngp/resources/assets/ajax/search/17.json`

Look for the line containing your postcode. The first number in the line is your sector code.

