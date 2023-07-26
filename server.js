const express = require('express');
const bodyParser = require('body-parser');
const app = express();

/*
npm install body-parser
npm install express

*/

/*---------------get--------------- */
// app.post('/', (req, res) => {
//     try {
//         console.log("Funciona");
//         res.send('hello world');
//     } catch(e) {
//         console.log("Error: ", e);
//     }
// })

/*---------------post--------------- */
app.use(bodyParser.json()) // para analizar el cuerpo de la solicitud en formato JSON, a partir de npm install body-parser

app.post('/register', (req, res) => {
    console.log(req.body);
    const { name, surname, phone, username, password, date } = req.body; // desestructuración de objetos
})

app.post('/login', (req, res) => {
    const { username, password } = req.body;
})

app.post('/register-emergency-contact', (req, res) => {
    const { name, phone_ec } = req.body;
})

app.post('/report-risk', (req, res) => {
    const { type_report, coordinates, date } = req.body
})

app.post('/favorite', (req, res) => {
    const { coordinates } = req.body;
})

app.post('/qualify-report', (req, res) => {
    const { vote } = req.body;
    console.log(vote);
})

app.post('/qualify-zone', (req, res) => {
    try {
        const { score } = req.body;
        console.log('Score: ', score);
        console.log("Conectao'");
    } catch (error) {
        console.log("El error: ", error);
    }

})

app.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000');
});
