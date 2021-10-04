const Nightmare = require('nightmare')
const nightmare = Nightmare({ show: true })
const fs = require('fs')
var request = require('request');
var XLSX = require('xlsx')

let reandomTime = (function(min = 12000, max = 15000) {
    return Math.round(Math.random() * (max - min) + min);
})();


nightmare
    .goto("https://emex.ru/")
    .cookies.set('last-location', '19489')
    
var workbook = XLSX.readFile('art.xlsx');
var sheet_name_list = workbook.SheetNames;
var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

for (let i=1; i<xlData.length; i++) {
    setTimeout( function timer() {
        console.log(xlData[i]);
            let brand = xlData[i].brand.toLowerCase().split('/')[0].replace(" ", "-");
            let number = String(xlData[i].number).toUpperCase().trim();
            Crawling(brand, number);
    }, i*reandomTime );
}

async function Crawling(brand, number) {
    nightmare
    .goto("https://emex.ru/products/"+ number + "/" + brand + "/19489")
        .wait(3000)
        .click('.ProductDescription__StyledPhotoIcon-sc-9q7a9-9')
            .wait(2000)
            .evaluate(() => document.querySelector(".LazyImg__Image-sc-13o4oin-0").src)
    .then(async response => {
        await DataProcessing(response, brand, number);
    })
    .catch(error => {
        SetLog(brand, number, 'Search failed');
        console.error('Search failed:', error)
    });
}

async function DataProcessing(link, brand, number) {
    let dir = fs.readdirSync("./img/", { withFileTypes: true }).filter(d => d.isDirectory());
    let isDir = dir.filter(n => n.name === brand );
    if(!isDir.length) {
        fs.mkdirSync("./img/" + brand);
    }
    var filename = number;
    console.log('Processing file ' + filename);
    request.get({
        url: link,
        encoding: "binary"
    },  (err, response, body) => {
            if (err) return console.log(err);
            fs.writeFile("./img/" + brand + "/" + number + ".jpg", body, "binary", (err) => {
                if (err) return SetLog(brand,number, err.message);
                SetLog(brand, number, "The file was saved!");
            });
    });
}

async function SetLog(brand, number, text) {
    fs.appendFile("ParsLog.txt", brand + "/" + number + "--" + text + "\n", function(error){
        console.log(error);
    }); 
}