const puppeteer = require("puppeteer");
const config = require("./config"); // configurações

async function curl(options) {
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err) return reject(err);
      resolve(body);
    });
  });
}

async function sleep(sec) {
  return new Promise((resolve, reject) => {
    setTimeout(function () {
      resolve();
    }, sec * 1000);
  });
}

async function resolve_captcha_v2(google_key, site_url) {
  let unparsed_captcha_id = await curl({
    method: "GET",
    url: `https://2captcha.com/in.php?key=${config.api_key}&method=userecaptcha&googlekey=${google_key}&pageurl=${site_url}&json=true`,
  });

  let parsed_captcha_id = JSON.parse(unparsed_captcha_id);
  let captcha_id = parsed_captcha_id.request;

  while (1) {
    await sleep(10);
    console.log("Seu captcha está sendo verficado");
    let captcha_ready = await curl({
      method: "GET",
      url: `https://2captcha.com/in.php?key=${config.api_key}&action=get&id=${captcha_id}&json=true`,
    });
    let parsed_captcha_ready = JSON.parse(captcha_ready);
    if (parsed_captcha_ready.status == 1) return parsed_captcha_ready.request;
    else if (parsed_captcha_ready.request != "CAPCHA_NOT_READY") return false;
  }
}

async function run() {
  let site_key = ""; // key
  let site_url = "https://www.google.com/recaptcha/api2/demo"; // url que o captcha está sendo exibido
  let captcha_token = await resolve_captcha_v2(site_key, site_url);
  if (!captcha_token) return console.log("Falha ao obter o token");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(site_url);
  let navigation_promise = page.waitForNavigation();
  await page.evaluate((inside_token) => {
    document.querySelector("#g-recaptcha-response").innerHTML = inside_token;
    document.querySelector("#recaptcha-demo-submit").click();
  }, captcha_token);
  await navigation_promise;
  let success = await page.$("recaptcha-sucess");
  if (success) return console.log("Captcha QUEBRADO");
  return console.log("Captcha falhou em ser quebrado");
}
run();
