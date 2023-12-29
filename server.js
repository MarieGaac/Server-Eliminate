const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const app = express();
const url = 'mongodb+srv://MarieGaac:NWizrvZUf1ZOXfh0@cluster0.d4ixu8k.mongodb.net/?retryWrites=true&w=majority';
//const url = 'mongodb://127.0.0.1:27017/';
const ObjectId = require('mongodb').ObjectId;
const fs = require('fs');

// const client = new MongoClient(url, { useUnifiedTopology: true });

//mongodb+srv://MarieGaac:<password>@cluster0.d4ixu8k.mongodb.net/?retryWrites=true&w=majority

const client = new MongoClient(url);

async function connectToDB() {
	try {
		await client.connect();
		console.log('Hay conexión a la base de datos');
	} catch (err) {
		console.error('No hay conexión a la base de datos:', err);
	}
}

connectToDB();

const database = client.db('placealert');

app.use(bodyParser.json());

/*---------------post--------------- */

const user_collection = 'user';
const report_collection = 'report';

app.post('/register-user', async (req, res) => {
	console.log(req.body);
	const { name_user, lname_user, birthday, birth_month, birth_year, phone_n, username, password } = req.body;

	const salt = bcrypt.genSaltSync(10);
	const hashedPassword = bcrypt.hashSync(password, salt);

	console.log(hashedPassword);

	const result = await database.collection(user_collection).insertOne({ name_user: name_user, lname_user: lname_user, birthday: birthday, birth_month: birth_month, birth_year: birth_year, phone_n: phone_n, username: username, password: hashedPassword })
	//const result2 = await database.collection('location').insertOne({_idUser: result.insertedId, latitude: 0, longitude: 0 });

	console.log(result.insertedId);
	res.send(result.insertedId);
})

app.post('/login', async (req, res) => {
	const { username, password } = req.body;

	const result = await database.collection(user_collection).findOne({ username: username })
	console.log(result);

	if (result != null) {
		const hashedPassword = result.password;

		const unhashedPassword = bcrypt.compareSync(password, hashedPassword);

		if (unhashedPassword) {
			if (username == 'Administrador') {
				res.send('admin');
				console.log('admin');
			} else {
				res.send(result);
			}
		} else {
			res.send("null");
		}
	} else {
		res.send("null");
	}
})

app.post('/consult-username', async (req, res) => {
	console.log(req.body);

	const { username } = req.body;

	const result = await database.collection('user').findOne({ username: username });

	console.log(result);
	if (result == null) {
		res.send('1');
	} else {
		res.send('0');
	}
})

app.post('/show-user-info', async (req, res) => {
	console.log(req.body);
	const { _idUser } = req.body;
	console.log(_idUser);
	const idAux = new ObjectId(_idUser)

	const result = await database.collection(user_collection).findOne({ _id: idAux });
	res.send(result);
})

app.post('/delete-user', async (req, res) => {
	const { _idUser, password_delete } = req.body;
	const _id = new ObjectId(_idUser);

	const result1 = await database.collection(user_collection).findOne({ _id: _id, password: password_delete })

	if (result1 == null) {
		res.send(false)
	} else {
		const result2 = database.collection(user_collection).deleteOne({ _id: _id, password: password_delete })
		if (result2 != null) {
			res.send(true)
			console.log(result2)
		}
	}

})

const emergency_contact_collection = 'emergency_contact';

app.post('/register-emergency-contact', async (req, res) => {
	console.log(req.body);
	const { _idUser, name_ec, phone_n_ec } = req.body;

	const result = await database.collection(emergency_contact_collection).insertOne({ _idUser: _idUser, name_ec: name_ec, phone_n_ec: phone_n_ec })

	res.send(result)
})

app.post('/show-contact-emergency', async (req, res) => {
	console.log(req.body);
	const { _idUser } = req.body;
	const result = await database.collection(emergency_contact_collection).find({ _idUser: _idUser });

	const results = await result.toArray();

	console.log(results);
	res.send(results);
})

app.post('/show-contact-info', async (req, res) => {
	console.log(req.body);
	const { idAux } = req.body;
	const _id = new ObjectId(idAux);
	const result = await database.collection(emergency_contact_collection).findOne({ _id: _id });

	res.send(result);
})

app.post('/edit-contact-emergency', async (req, res) => {
	console.log(req.body);
	const { idAux, type_data } = req.body;
	const _id = new ObjectId(idAux)
	console.log(type_data);
	var result;
	if (type_data == 1) {
		const { name_ec_e } = req.body;
		result = await database.collection('emergency_contact').updateOne({ _id: _id }, { $set: { name_ec: name_ec_e } }, {})
		console.log(result);

	} else if (type_data == 2) {
		const { phone_n_ec_e } = req.body;
		result = await database.collection('emergency_contact').updateOne({ _id: _id }, { $set: { phone_n_ec: phone_n_ec_e } }, {})
		console.log(result);

	} else {
		result = null
	}
	res.send(result)
})

app.post('/delete-contact-emergency', async (req, res) => {
	const { idAux } = req.body;
	const _id = new ObjectId(idAux);

	const result = await database.collection('emergency_contact').deleteOne({ _id: _id })
	res.send(result)
})

app.post('/score-risk-zone', async (req, res) => {
	console.log(req.body);
	const { postal_code, l1, l2, score } = req.body;

	const result = await database.collection('risk_zone').insertOne({ postal_code: postal_code, latitude: l1, longitude: l2, score: score })

	res.send(result)
})

app.post('/vote_report', async (req, res) => {
	console.log(req.body);
	const { showID, vote, _idUser } = req.body;
	const idAux = new ObjectId(showID);

	const result1 = await database.collection('report').findOne({ _id: idAux });

	console.log(result1.votes)

	let new_votes = result1.votes;

	if (new_votes == undefined) new_votes = 0

	if (vote == 1) new_votes++;
	else if (vote == 2) new_votes--;

	console.log(new_votes);
	const result2 = await database.collection('report').updateOne({ _id: idAux }, { $set: { votes: new_votes } }, {})
	const result3 = await database.collection('report').updateOne({ _id: idAux }, { $push: { "users": _idUser } })

	console.log(result3);
	console.log(result2);
	res.send(result2)
})

app.post('/register-report-incident', async (req, res) => {
	console.log(req.body);
	const { _idUser, dateString, latitude, longitude, incident } = req.body;
	const result = await database.collection('report').insertOne({ _idUser: _idUser, date_report: dateString, incident_type: incident, coordinates_report: { latitude, longitude } })

	console.log(result)
	res.send(result)
})

app.post('/show-report-incident', async (req, res) => {
	console.log(req.body);
	const { _idUser } = req.body;
	const result = await database.collection('report').find({ "users": { $nin: [_idUser] } });

	const r = await result.toArray();
	console.log("hiiii");
	console.log(r.data);
	res.send(r);
})

app.post('/show-report-user', async (req, res) => {
	console.log(req.body);
	const { _idUser } = req.body;

	const result = await database.collection('report').find({ _idUser: _idUser })

	const results = await result.toArray();

	console.log(results);
	res.send(results);
})

app.get('/show-risk-zones', async (req, res) => {
	const result = await database.collection('risk_zone').find({})
	const results = await result.toArray();

	const pc = results.map(result => result.postal_code)


	const removeDuplicates = (pc) => {
		return pc.filter((item,
			index) => pc.indexOf(item) === index);
	}

	let classifiedPC = removeDuplicates(pc);

	function getScoresByPostalCodes(objects, postalCodes) {
		const scoresByPC = {};

		for (const postalCode of postalCodes) {
			scoresByPC[postalCode] = {
				scores: [],
				average: 0,
			};

			for (const object of objects) {
				if (object.postal_code === postalCode) {
					scoresByPC[postalCode].scores.push(object.score);
				}
			}

			// Calcula el promedio de los scores
			if (scoresByPC[postalCode].scores.length > 0) {
				const sum = scoresByPC[postalCode].scores.reduce((a, b) => a + b, 0);
				scoresByPC[postalCode].average = sum / scoresByPC[postalCode].scores.length;
			}
		}

		for (let i = 0; i < results.length - 1; i++) {
			const currentObject = results[i].postal_code;

			const averagePostalCode = scoresByPC[currentObject].average;

			const currentScore = results[i].score;
			results[i].score = (currentScore + averagePostalCode) / 2;
		}
		return scoresByPC;
	}
	getScoresByPostalCodes(results, classifiedPC);


	// for (let i = 0; i < results.length - 1; i++) {
	// 	const currentObject = results[i];
	// 	const nextObject = results[i + 1];

	// 	if (currentObject.postal_code === nextObject.postal_code) {
	// 		nextObject.score = r[currentObject.postal_code].average;
	// 	}
	// }



	res.send(results);
})

app.post('/obtain-info-risk-zone', async (req, res) => {
	const { postal_code } = req.body;
	const result = await database.collection('risk_zone').find({ postal_code: postal_code });
	const results = await result.toArray();
	console.log(results)
	function getAverage(objects) {
		scores = [];
		for (const object of objects) {
			scores.push(object.score);
		}
		const sum = scores.reduce((a, b) => a + b, 0);
		average = sum / scores.length;
		const data = { average: average, scores_length: scores.length };
		res.send(data);
	}

	getAverage(results);
})

app.post('/evaluate-report', async (req, res) => {
	console.log(req.body);
	const { idReport, valueStatusPicker } = req.body;
	console.log(typeof idReport);
	const idAux = new ObjectId(idReport)
	console.log(typeof idAux)

	const result = await database.collection('report').updateOne({ _id: idAux }, { $set: { status: valueStatusPicker } }, {})
	if (valueStatusPicker == 'Approved') {
		const find_coordinates = await database.collection('report').findOne({ _id: idAux })
		const result2 = await database.collection('risk_zone').insertOne({ postal_code: postal_code, latitude: find_coordinates.latitude, longitude: find_coordinates.longitude, score: 5 })
	}
	console.log(result)
	res.send(result);
})

app.post('/edit_profile', async (req, res) => {
	console.log(req.body);
	const { _idUser, type_data } = req.body;
	const idAux = new ObjectId(_idUser)
	console.log(type_data);
	var result;
	if (type_data == 1) {
		const { name_user_e } = req.body;
		result = await database.collection('user').updateOne({ _id: idAux }, { $set: { name_user: name_user_e.trim() } }, {})
		console.log(result);

	} else if (type_data == 2) {
		const { lname_user_e } = req.body;
		result = await database.collection('user').updateOne({ _id: idAux }, { $set: { lname_user: lname_user_e } }, {})
		console.log(result);

	} else if (type_data == 3) {
		const { birthday_e, birth_month_e, birth_year_e } = req.body;
		result = await database.collection('user').updateOne({ _id: idAux }, { $set: { birthday: birthday_e, birth_month: birth_month_e, birth_year: birth_year_e } }, {})
		console.log(result);

	} else if (type_data == 4) {
		const { phone_n_e } = req.body;
		result = await database.collection('user').updateOne({ _id: idAux }, { $set: { phone_n: phone_n_e } }, {})
		console.log(result);

	} else if (type_data == 5) {
		const { username_e } = req.body;
		result = await database.collection('user').updateOne({ _id: idAux }, { $set: { username: username_e } }, {})
		console.log(result);

	} else if (type_data == 6) {
		const { password_e } = req.body;
		result = await database.collection('user').updateOne({ _id: idAux }, { $set: { password: password_e } }, {})
		console.log(result);
	} else {
		result = null
	}
	res.send(result)
})

app.post('/register-favorite', async (req, res) => {
	console.log(req.body);
	const { _idUser, latitude, longitude } = req.body;
	const result = await database.collection('favorites').insertOne({ _idUser: _idUser, latitude: latitude, longitude: longitude })
	console.log(result);
	res.send(result)
})

app.post('/show-favorites', async (req, res) => {
	const { _idUser } = req.body;
	console.log(_idUser);

	const result = await database.collection('favorites').find({ _idUser: _idUser });

	const results = await result.toArray();

	console.log(results);
	res.send(results);
})

app.post('/show-no-favorites', async (req, res) => {
	const { _idUser } = req.body;
	console.log(_idUser);

	const result = await database.collection('nofavorites').find({ _idUser: _idUser });

	const results = await result.toArray();

	console.log(results);
	res.send(results);
})

app.post('/register-no-favorite', async (req, res) => {
	console.log(req.body);
	const { _idUser, latitude, longitude, postal_code } = req.body;
	const result = await database.collection('nofavorites').insertOne({ _idUser: _idUser, latitude: latitude, longitude: longitude })
	const result2 = await database.collection('risk_zone').insertOne({ postal_code: postal_code, latitude: latitude, longitude: longitude, score: 5 })
	console.log(result);
	console.log(result2);
	res.send(result)
})
app.post('/remove-no-favorite', async (req, res) => {
	const { id } = req.body;
	const _id = new ObjectId(id);

	const response = await database.collection('nofavorites').deleteOne({ _id: _id })
})

app.post('/remove-favorite', async (req, res) => {
	const { id } = req.body;
	const _id = new ObjectId(id);

	const response = await database.collection('favorites').deleteOne({ _id: _id })
})

var path = require("path");
const http = require("http");

app.post('/store-hashedID', async (req, res) => {
	const { _idUser /*, hashedID*/ } = req.body;

	const response1 = await database.collection('location').deleteMany({ _idUser: _idUser });

	const response2 = await database.collection('location').insertOne({ _idUser: _idUser, latitude: 0, longitude: 0 }/*, { $set: { hashedID: hashedID } }*/);
})

app.post('/store-location-user', async (req, res) => {
	console.log(req.body);

	const { _idUser, latitude, longitude } = req.body;

	const response = await database.collection('location').updateOne({ _idUser: _idUser }, { $set: { latitude: latitude, longitude: longitude } });
	console.log(response);
	res.sendStatus(200);
})

app.get('/show-location-user/:id', async (req, res) => {
	// const latitude = 19.4083017126017;
	// const longitude = -99.16055348942105;
	// console.log(req.query.latitude)
	// const latitude = req.query.latitude;
	// const longitude = req.query.longitude;

	const id = req.params.id;

	// console.log(req.params); :id&:dd
	const idAux = id.toString();

	const result = await database.collection('location').findOne({ _idUser: idAux });

	console.log(result);

	const latitude = result.latitude;
	console.log(latitude)
	const longitude = result.longitude;

	// const {latitude, longitude} = req.body;

	const name_user = 'Lu';


	const template = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
	<title>Ubicación de `+ name_user + `</title>
	</head>
	<body>
	<div id="googleMap" style="width:100%;height:600px;"></div>
	<script>
	function myMap() {
		var mapProp = {
			center: new google.maps.LatLng(`+ latitude + `, ` + longitude + `),
			zoom: 20,
		};
		var marker = new google.maps.Marker({
			position: { lat: `+ latitude + `, lng: ` + longitude + ` },
		});


		var map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
		marker.setMap(map);
	}
	</script>
	<script
	src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB9bfQ3nNfGp25XQlX-pMfZmaH9CyDP0mQ&callback=myMap"></script>
	</body>
	</html>
	`;

	res.send(template)
})

app.listen(3001, () => {
	console.log('Servidor corriendo en el puerto 3001');
})

