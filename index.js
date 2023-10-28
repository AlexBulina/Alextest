import express from 'express';
import mongoose  from 'mongoose';
const app = express();
const port = 3000;
const  url = 'http://milamed.org.ua:9998/KDG_SIMPLE_LAB_API/Milamed';
let reqcount = 0;
let ipAddress;
let OS;
let region;
let city;

const stopListSchema = new mongoose.Schema({
WebCode: String
});
const smsGetTimeout = new mongoose.Schema({
  WebCode: String,
  Time: { type: Date, default: Date.now },
  Count: {type: Number, default: 1}

  });

const StopList = mongoose.model('StopList', stopListSchema);
const SmsGetTimeout = mongoose.model('SmsGetTimeout', smsGetTimeout);

app.use(async (req, res, next) => {

mongoose.connect('mongodb+srv://Ashway:MxLANHy9Nza2cbhX@tbot.m2fi1tc.mongodb.net/MTSTEST?retryWrites=true&w=majority');
  mongoose.connection.on('connected', () => {console.log('MongoDB connected!');});
// Load stopList from MongoDB
let stopList = [];
try {

  let docs = await StopList.find({});
  stopList = docs.map(doc => doc.WebCode);
  console.log('Завантаженя Стоп-листа виконано успішно:', stopList);

  
    if (stopList.includes(req.originalUrl.slice(1))) {
      console.log(`Знайдено значення ${req.originalUrl.slice(1)} в масиві`);
      
      res.status(500).send('<h1>Доступ по Вашому ID тимчасово обмежено. Спробуйте пізніше</h1>');
      return; // Примусово зупинити виконання forEach циклу
    } else if (req.originalUrl.slice(1) != 'favicon.ico'){
      //mongoose.connection.close();
      next();
    }
 
} catch (err) {
  console.error('Error loading stopList from MongoDB:', err);
};
});




app.use(async (req, res, next) => {
  let clientIp = req.ip; // Отримайте IP-адресу користувача з Express.js
  let ipParts = clientIp.split(':');
  
  // Отримуємо останній елемент масиву, який містить чистий IPv4
 //let ipv4Address = ipParts[ipParts.length - 1];
  let ipv4Address = '212.111.201.252';

  // Використовуйте сервіс для отримання інформації про IP-адресу
  try {
    const response = await fetch(`https://ipinfo.io/${ipv4Address}/json`);
    if (response.ok) {
      const data = await response.json();
      let country = data.country;
       region = data.region;
       city = data.city;
      if (country === 'UA') { // Перевірте, чи це IP-адреса з України (UA - код для України)
        next(); // Пропустіть запит, якщо це IP з України
      } else {
        res.status(403).send('Доступ заборонено. Доступ дозволено лише з IP-адресами з України.');
      }
    } else {
      console.error('Помилка при перевірці IP-адреси');
      res.status(500).send('Помилка при обробці запиту.');
    }
  } catch (error) {
    console.error('Помилка при отриманні інформації про IP-адресу: ', error);
    res.status(500).send('Помилка при обробці запиту.');
  }
});

app.get('/:code', async (req, res) => { 
  let code = req.params.code;
  let UserAgent = req.get('User-Agent');
  switch (true) {
    case UserAgent.includes('Windows'):
      OS = 'Windows';
      break;
    case UserAgent.includes('Android'):
      OS = 'Android';
      break;
    case UserAgent.includes('Linux'):
      OS = 'Linux';
      break;
    case UserAgent.includes('Macintosh'):
      OS = 'Macintosh';
      break;
    case UserAgent.includes('Darwin'):
      OS = 'Apple MacOS X or IOS Apple';
      break;
    case UserAgent.includes('iPhone'):
      OS = 'iPhone';
      break;
    case UserAgent.includes('WhatsApp'):
      OS = 'WhatsApp software';
      break;
    case UserAgent.includes('iPad'):
      OS = 'iPad';
      break;
    case UserAgent.includes('iPod'):
      OS = 'iPod';
      break;
    case UserAgent.includes('BlackBerry'):
      OS = 'BlackBerry';
      break;
    case UserAgent.includes('Windows Phone'):
      OS = 'Windows Phone';
      break;
    default:
      OS = 'Unknown operating system or VPN in use';
      console.log(UserAgent);
      break;
  }

  // Перевірка на stoplist
  
  try {
    const response = await fetch(`${url}/examination/getResultsPDF?ExaminationResultsPDFCode=${code}&ShowOnlyReady=false`, {
      headers: {
        'Authorization': 'Basic TWlsYW1lZHx3ZWI6ZmRiNEshSTN5WQ=='
      }
    });

    if (!response.ok) {
      res.send('<h1>Виникла помилка при завантаженні результатів</h1> \n <h2>Спробуйте пізніше</h2>');
      return;
    }
    
    const buffer = await response.arrayBuffer();

    if (buffer.byteLength < 1024) {
      res.send('<h1>Виникла помилка при завантаженні результатів</h1> \n <h2>Спробуйте пізніше</h2>');
      return;
    }

    const fileBufferpdf = Buffer.from(buffer);
    const date = new Date();
    reqcount++;

   
   
      const smsGetTimeout = new mongoose.Schema({
        WebCode: String,
        Time: { type: Date, default: Date.now },
        Count: {type: Number, default: 1}
      });
    
    
    try {
     await mongoose.connect('mongodb+srv://Ashway:MxLANHy9Nza2cbhX@tbot.m2fi1tc.mongodb.net/MTSTEST?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
      const existingSmsGetTimeout = await SmsGetTimeout.findOneAndUpdate(
        { WebCode: code },
        { $inc: { Count: 1 } },
        { upsert: true, new: true }
      );
      console.log(existingSmsGetTimeout);
      console.log('Дані успішно записано до бази даних');
    } catch (error) {
      console.error('Помилка при записі до бази даних: ', error);
    }
    try {
      await mongoose.connect('mongodb+srv://Ashway:MxLANHy9Nza2cbhX@tbot.m2fi1tc.mongodb.net/MTSTEST?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
      const result = await SmsGetTimeout.findOne({ WebCode: code });
      console.log(result.Count);
        if (result.Count <= 10) {  
            if ((Math.ceil(Math.abs(result.Time - date) / (1000 * 60 * 60 * 24))) < 30){

                res.setHeader('Content-Disposition', 'attachment; filename=results.pdf');
                res.setHeader('Content-Type', 'application/pdf');
                res.send(fileBufferpdf);

            } else {res.send(`<h1>Термін дії коду рівний 30 днів з моменту першого запиту</h1> \n <h2>Термін дії сплив.</h2> \n <h2>Для отримання результату зверніться в лабораторію особисто або через Call-center</h2> \n <h2> \n 067 555 80 77 * 067 394 61 08 * 0382-65 23 21</h2>`); }
            
          } else {
         res.send('<h1>Максимальна кількість завантажень по одному коду рівна 10 спроб.</h1> \n <h2>Ви перевищили ліміт.</h2>'); }



    
    } catch (error) {
      console.error('Помилка при зверненні до бази даних: Спробуйте пізніше ', error);
    }
    let today = date.toLocaleString();
   // console.log(today);
    if (req.socket.remoteAddress != undefined || req.socket.remoteAddress != null) {
    ipAddress =  (req.socket.remoteAddress).split(':');
    console.log(`${reqcount} - ${code} - ${today} - ${ipAddress[ipAddress.length-1]} - ${region} - ${city} - ${OS}`);} else {
       ipAddress = 'Unknown IP'
       console.log(`${reqcount} - ${code} - ${today} - ${ipAddress} - ${region} - ${city} - ${OS}`);
      }
  } catch (error) {
    console.error(error);
   // res.status(500).send('Internal Server Error');
  }
});

        app.listen(port, () => console.log(`WEB Застосунок для SMS PDF запущено на порту ${port}!`));