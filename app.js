// import express module
var express = require('express');
var path = require('path');
const fs = require('fs');
var app = express();

// import body-parser module
const { body, validationResult } = require('express-validator');

// set up handlebars
const exphbs = require('express-handlebars');

// port number on which server will listen
const port = process.env.port || 3000;

// --- MIDDLEWARE ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// set up handlebars engine
app.engine('hbs', exphbs({ extname: '.hbs', partialDir: path.join(__dirname, 'views', 'partials'), helpers: {
    displayName: function (name) {
      return name && name.trim() !== '' ? name : 'N/A';
    },
    highlightIfEmpty: function (name) {
      return name && name.trim() !== '' ? '' : 'background-color: #ffe6e6;'; // light red highlight
    }
  } }));
app.set('view engine', 'hbs');

// --- ROUTES ---

// home page
app.get('/', (req, res) => {
  res.render('index', { title: 'Express' });
});

// user route
app.get('/users', (req, res) => {
  res.send('respond with a resource');
});

// about route
app.get('/about', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'html', 'Resume.html');
  const resumeHtml = fs.readFileSync(filePath, 'utf8');
  res.render('about', { title: 'About Me', resumeContent: resumeHtml });
});

// Load Airbnb dataset
// const fullFilePath = path.join(__dirname, 'data', 'airbnb_with_photos.json');
// const smallFilePath = path.join(__dirname, 'data', 'airbnb_small.json');

// let airbnbData = [];

// try {
//   if (fs.existsSync(fullFilePath)) {
//     airbnbData = JSON.parse(fs.readFileSync(fullFilePath, 'utf8'));
//     console.log(`Loaded full dataset: ${airbnbData.length} records`);
//   } else {
//     airbnbData = JSON.parse(fs.readFileSync(smallFilePath, 'utf8'));
//     console.log(`Loaded small dataset: ${airbnbData.length} records`);
//   }
// } catch (err) {
//   console.error('Error loading dataset:', err);
//   airbnbData = [];
// }

const smallFilePath = path.join(__dirname, 'data', 'airbnb_small.json');

let airbnbData = [];

try {
  airbnbData = JSON.parse(fs.readFileSync(smallFilePath, 'utf8'));
  console.log(`Loaded small dataset: ${airbnbData.length} records`);
} catch (err) {
  console.error('Error loading dataset:', err);
  airbnbData = [];
}


// --- SEARCH BY ID ---
// form
app.get('/search/id', (req, res) => {
  res.render('searchByID', { title: 'Search by Property ID' });
});

// logic
app.post(
  '/search/id',
  body('propertyId')
    .notEmpty().withMessage('Property ID is required')
    .trim()
    .escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('searchByID', { title: 'Search by Property ID', errors: errors.array() });
    }

    const propertyId = req.body.propertyId;
    const record = airbnbData.find(item => item.id === propertyId);

    if (!record) {
      return res.render('searchByID', { title: 'Search by Property ID', notFound: true });
    }

    res.render('propertyDetails', { title: `Property ID ${propertyId}`, record });
  }
);

// --- SEARCH BY NAME ---
app.get('/search/name', (req, res) => {
  res.render('searchByName', { title: 'Search by Property Name' });
});

app.post(
  '/search/name',
  body('propertyName')
    .notEmpty().withMessage('Property Name is required')
    .trim()
    .escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('searchByName', { title: 'Search by Property Name', errors: errors.array() });
    }

    const searchName = req.body.propertyName.toLowerCase();
    const results = airbnbData.filter(item =>
      item.NAME && item.NAME.toLowerCase().includes(searchName)
    );

    if (results.length === 0) {
      return res.render('searchByName', { title: 'Search by Property Name', notFound: true });
    }

    res.render('searchByName', { title: `Results for "${req.body.propertyName}"`, results });
  }
);



// step 8 
app.get('/viewData', (req, res) => {
    const limitedData = airbnbData.slice(0, 100);
  res.render('viewData', { 
    title: 'View All Airbnb Data',
    records: airbnbData
  });
});


// step 9
app.get('/viewData/clean', (req, res) => {
    const limitedData = airbnbData.slice(0, 100);
  res.render('viewDataClean', { 
    title: 'View Clean Airbnb Data',
    records: airbnbData
  });
});


// step 11
app.get('/viewData/price', (req, res) => {
    const limitedData = airbnbData.slice(0, 100);
  res.render('viewDataPrice', { title: 'Search by Price Range' });
});

app.post(
  '/viewData/price',
  body('minPrice')
    .notEmpty().withMessage('Minimum price is required')
    .isNumeric().withMessage('Minimum price must be numeric')
    .trim()
    .escape(),
  body('maxPrice')
    .notEmpty().withMessage('Maximum price is required')
    .isNumeric().withMessage('Maximum price must be numeric')
    .trim()
    .escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('viewDataPrice', { 
        title: 'Search by Price Range',
        errors: errors.array()
      });
    }

    const min = Number(req.body.minPrice);
    const max = Number(req.body.maxPrice);

    // remove $ and spaces from price strings before comparison
    const filtered = airbnbData.filter(item => {
      if (!item.price) return false;
      const numericPrice = Number(item.price.replace(/[^0-9.-]+/g, ''));
      return numericPrice >= min && numericPrice <= max;
    });

    res.render('viewDataPrice', { 
      title: `Properties between $${min} and $${max}`,
      results: filtered
    });
  }
);



// --- 404 handler ---
app.get('*', (req, res) => {
  res.render('error', { title: 'Error', message: 'Wrong Route' });
});

// start server
// app.listen(port, () => {
//   console.log(`Example app listening at http://localhost:${port}`);
// });

module.exports = app;

// if running locally
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
}
