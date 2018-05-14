const fetch = require('node-fetch');
const readline = require('readline');
const cheerio = require('cheerio');

let rl = readline.createInterface( {
    input: process.stdin,
    output: process.stdout
});

/**
 * PromptQuestion: gets the input from the user
 *  if no input is entered, it asks for the input again
 *  if exit is entered, the program stop running
 * @returns {Promise<any>}
 */
function promptQuestion() {
    return new Promise((resolve, reject) => {
        rl.question('Search: ', (answer) => {

            if(answer.toLowerCase().trim() === "exit") {
                rl.close();
            } else if(answer.trim() === "") {
                reject(new Error("EMPTY_INPUT"))
            } else {
                resolve(answer);
            }
        });
    });
}

/**
 * searchWiki: fetching the wikipedia api
 *  if the search doesn't contain any page, it would return No results.
 *  otherwise it would call the searchImage function.
 * @param answer: user input from promptQuestion
 */
function searchWiki(answer) {
    const searchURL = "https://en.wikipedia.org/w/api.php?action=opensearch&search=" + encodeURIComponent(answer) + "&limit=1&namespace=0";

    return fetch(searchURL)
        .then((rsp) => rsp.json())
        .then((json) => {
            if(json.length === 0) {
                throw new Error("INVALID_RESPONSE");
            } else {
                if(json[3].length === 0) {
                    throw new Error("INVALID_RESPONSE");
                } else {
                    return json;
                }
            }
        })
}


/**
 * searchImage: fetching the wikipedia api for the page of the person
 * if the page contains an image, it will return the link to the image
 * otherwise, it would return no-image
 * getURL will log the name and URL in json format
 * @param json: response in the json format from the fetching the wikipedia api
 */
function searchImage(json) {

    let theName;
    if(json.length < 2) {
        throw new Error("INVALID_RESPONSE");
    } else {
        theName = json[1];
    }

    const imageUrl = "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original&titles=";
    const searchUrlImage = imageUrl + encodeURIComponent(theName) + "&format=json";

    return fetch(searchUrlImage)
        .then((rsp) => rsp.json())
        .then((jsn) => {

            //finding the page id from the response
            const pageID = Object.keys(jsn.query.pages);
            let theUrl = "";

            //using the page id and check if it has the property of original
            //if it has original(object), then the page has an image
            //otherwise it doesn't have any image
            if(jsn.query.pages[pageID[0]].hasOwnProperty('original')) {

                theUrl = jsn.query.pages[pageID[0]].original.source;

            } else {
                theUrl = 'no-image';
            }
            let realName;
            if(theName["0"].length === 0){
                throw new Error("INVALID_RESPONSE");
            } else {
                realName = theName["0"];
            }
            const jsonlog = {
                name: realName,
                imageUrl: theUrl
            };

            return jsonlog;

        });
}

/**
 * searchGoogle : fetching google and return the first image url
 * @param answer
 * @returns {Promise<RESULT>|*|void|PromiseLike<T>|Promise<T>}
 */
function searchGoogle(answer) {
    const googleURL = "http://www.google.com/images?q=" + encodeURIComponent(answer);
    return fetch(googleURL)
        .then((rsp) => rsp.text())
        .then((txt) => {
            let $ = cheerio.load(txt);
            let imageLink = $('img').attr('src');
            let theName = $('img').attr('alt');
            let results = {Search: theName, Image_url: imageLink};
            return results;

        });
}

/* ==== Main ==== */
function main() {
        rl.question('Search Options:\n\t1)Wikipedia\n\t2)Google\n\t3)Exit\n', choice => {

            switch(choice.toLowerCase().trim()) {
                case "exit":
                    rl.close();
                    break;
                case "1":
                case "wikipedia":
                    promptQuestion()
                        .then(searchWiki)
                        .then(searchImage)
                        .then((response) => {
                            console.log(response);
                            main();
                        })
                        .catch((error) => {
                            console.log(error);
                        })
                    break;
                case "2":
                case "google":
                    promptQuestion()
                        .then(searchGoogle)
                        .then((response) => {
                            console.log(response);
                            main();
                        })
                        .catch((error) => {
                            console.log(error);
                            main();
                        })
                    break;
                case "3":
                    rl.close();
                    break;
                default:
                    console.error("INVALID_INPUT");
                    main();
            }
        })

}

main();
