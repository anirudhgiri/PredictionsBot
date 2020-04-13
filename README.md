![PredictionsBot](https://i.imgur.com/zYRiNYS.png)
# PredictionsBot

PredictionsBot is a Discord Bot built using Javascript (with [NodeJS](https://nodejs.org/)) for the client [Internet Wrestling Discord](https://wrestlingdiscord.com/) to handle predictions for pro-wrestling events using Google Forms and the Google Sheets API.

## Usage

The staff at Internet Wrestling Discord prepare a predictions form using Google Form for an upcoming pro-wrestling event and set the form live using the `?setForm` command. Participants can use the `?predictions` to attain a customized Google Forms link with their details pre-filled. Their predictions, once submitted can be viewed using the `?picks show` command (or `?picks` to be viewed privately).

Once the pro-wrestling event is over, the number of matches who's outcome was predicted correctly can be viewed using the `?score` command.

VIP members (Patreon donators) can view their scores as the event is going on using the `?live` command.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
