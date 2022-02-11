const axios = require('axios');
const FormData = require('form-data');
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_KEY });

const args = process.argv.slice(2);
const tweet_url = args[0];
console.log(`tweet_url: ${tweet_url}`);
var turl_array = tweet_url.split("/");
console.log(`tweet_url_array: ${turl_array}`);
const tid = turl_array.pop();
console.log(`tweet_id: ${tid}`);

axios.post('https://tweet-image.glitch.me/get-image', {
    "tweetUrl":tweet_url,
    "width":"800",
    "padding":"0",
    "theme":"light",
    "hideCard":"false",
    "hideThread":"true"
})
.then(res => {
    console.log(`tweet-image-status: ${res.status}`)
    
    let data = new FormData();
    data.append('type', 'base64');
    data.append('image', res.data);

    let config = {
        method: 'post',
        url: 'https://api.imgur.com/3/image',
        headers: { 
            'Authorization': 'Client-ID ' + process.env.IMGUR_CLIENT_ID, 
            ...data.getHeaders()
        },
        data : data
    };

    axios(config)
        .then(res => {
            console.log(JSON.stringify(res.data));
            const imgurl = res.data["data"]["link"];
            console.log(`imgur_url: ${imgurl}`);

            notion.pages.create({
                parent: { database_id: process.env.NOTION_DATABASE_ID },
                properties: {
                    title: {title: [{"text": {"content": tid}}]},
                    Status: {select: {name: '推特信息'}},
                    tweet_url: {"url": tweet_url}
                },
                children: [
                    {
                        object: 'block',
                        type: 'embed',
                        embed: {url: imgurl},
                    },
                ]
            })
            .then(res => {
                console.log(res)
                console.log("Success! Entry added.")
            })
            .catch(error => {
                console.error(error)
            })
        })
        .catch(error => {
            console.error(error)
        });
})
.catch(error => {
    console.error(error)
})
