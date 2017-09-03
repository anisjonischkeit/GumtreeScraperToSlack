// while (true) {}
const express = require('express');
const fs = require('fs');
const Xray = require('x-ray');
const request = require('request');

const app = express();
const xray = Xray();
xray.timeout(20000)

const GUMTREE_JSON_FILE = "./gumtree.json"
const GUMTREE_URLS_FILE = "./gumtreeUrls.json"
let _firstRun = true

gumtree = {}
gumtreeUrls = new Set()


// ##################################################################
// 
//                             SCRAPER
// 
// ##################################################################

const sendSlackAlert = (message) => {
    request.post({
        url: 'https://hooks.slack.com/services/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',
        body: message,
        headers: {
            "Content-type": "application/json"
        }
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    });
}

const scrape = (url, callback=(()=>{})) => {

    xray(url, ".panel.search-results-page__main-ads-wrapper.user-ad-collection.user-ad-collection--row > .panel-body.panel-body--flat-panel-shadow.user-ad-collection__list-wrapper > a", [{        
        link: "@href",
        title: ".user-ad-row__title",
        price: ".user-ad-price__price",
        location: ".user-ad-row__location",
        image: ".user-ad-row__image@src",
    }]
    )
    .then(re => {
        re.forEach(item => {
            let gItem = gumtree[item.link]
            console.log(gItem)
            if (gItem === undefined && !_firstRun) {
                // send a text
                gumtree[item.link] = item
                gumtree[item.link].latestPrice = item.price

                sendSlackAlert(
                    JSON.stringify({
                        "attachments": [
                            {
                                "fallback": `New Item Listed ${item.title}`,
                                "color": "#36a64f",
                                "pretext": "New Item Listed",
                                "title": item.title,
                                "title_link": item.link,
                                "text": `*Price:* ${item.price}\n *Location:* ${item.location}`,
                                "image_url": item.image,
                                "thumb_url": item.image,
                                "mrkdwn_in": ["text"]
                            }
                        ]
                    })
                )
            } else if (gItem.latestPrice !== item.price) {
                // send a text
                gItem.price += " ->> " + item.price
                gItem.latestPrice = item.price

                sendSlackAlert(
                    JSON.stringify({
                        "attachments": [
                            {
                                "fallback": `Price Update on ${gItem.title}`,
                                "color": "#28d7e5",
                                "pretext": "Item Price Update",
                                "title": gItem.title,
                                "title_link": gItem.link,
                                "text": `*Price:* ${gItem.price}\n *Location:* ${gItem.location}`,
                                "image_url": gItem.image,
                                "thumb_url": gItem.image,
                                "mrkdwn_in": ["text"]
                            }
                        ]
                    })
                )
            }
        })

        const firs = gumtree["https://www.gumtree.com.au/s-ad/brisbane-city/other-electronics-computers/brand-new-sealed-dji-mavic-pro-fly-more-combo/1157691116"]


        fs.writeFile(GUMTREE_JSON_FILE, JSON.stringify(gumtree), function(err) {
            if (err) {
                console.log(err)
            } else {
                console.log("The JSON file was saved!");
            }
        }); 

        _firstRun = false
        callback()
    })
}


// ##################################################################
// 
//                             ENDPOINTS
// 
// ##################################################################

app.get("/gumtree/get/json", (req, res) => {
    fs.writeFile(GUMTREE_URLS_FILE, JSON.stringify([...gumtreeUrls]), function(err) {
        if (err) {
            console.log(err)
        } else {
            console.log("The URLS file was saved!");
        }
    }); 
    scrape(url, () => {
        res.send(gumtree)
    })
})

app.get("/gumtree/get/urls", (req, res) => {
    res.send([...gumtreeUrls])
})

app.get("/gumtree/add/urls", (req, res) => {
    const url = req.query.url

    if (url == null) {
        return res.send("Please specify the url to add")
    }
    gumtreeUrls.add(url)
    return res.send(`Successfully added ${url}`)
})

// ##################################################################
// 
//                             SETUP
// 
// ##################################################################

{
    try {
        const gumtreeJsonFile = fs.readFileSync(GUMTREE_JSON_FILE, "utf8") 
        gumtree = JSON.parse( gumtreeJsonFile ) 

        console.log("read gumtree json file")
    } catch(e) {
        console.log(e)
    }

    try {
        const gumtreeUrlsFile = fs.readFileSync(GUMTREE_URLS_FILE, "utf8") 
        gumtreeUrls = new Set( JSON.parse( gumtreeUrlsFile ) )

        console.log("read gumtree urls file")
    } catch(e) {
        console.log(e)
    }
}

app.listen(8081, function () {
    console.log('Example app listening on port 8081!')
})

setInterval(() => {
    for (let url of gumtreeUrls) {
        scrape(url)
    }
}, 3 * 60 * 1000)

exports = module.exports = app;