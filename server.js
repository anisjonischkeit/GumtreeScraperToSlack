const express = require('express');
var app = express();

var Xray = require('x-ray');
var xray = Xray();
xray.timeout(10000)


app.get("/gumtree", (req, res) => {
    xray(req.query.url, ".panel.search-results-page__main-ads-wrapper.user-ad-collection.user-ad-collection--row > .panel-body.panel-body--flat-panel-shadow.user-ad-collection__list-wrapper", {
        items: xray("a", [{
            title: ".user-ad-row__title",
            price: ".user-ad-price__price",
            location: ".user-ad-row__location",
            image: ".user-ad-row__image@src",
            
        }])
    }
    )//")
    .then(re => {
        console.log("re")
        console.log(re)
        res.send(re)
    })
    .catch(() => {
        res.sendStatus(400)
        res.send("something went wrong")
    })
})

app.listen(8081, function () {
    console.log('Example app listening on port 8081!')
})

exports = module.exports = app;