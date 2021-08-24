const request = require("request");
const fs = require("fs");
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

async function resolve_captcha() {
  let captcha_file = await fs.promises.readFile("./captcha.jpg", {
    encoding: "base64",
  });
  let resolve_captcha = await curl({
    method: "POST",
    url: "https://2captcha.com/in.php",
    form: {
      key: config.api_key, // puxando a chave da api da variavel global config
      method: "base64",
      body: captcha_file,
      json: true,
    },
  });
  let resolved_captcha = JSON.parse(resolve_captcha);
  let captcha_id = resolved_captcha.request;

  while (1) {
    await sleep(10);
    let captcha_status = await curl({
      method: "GET",
      url: `https://2captcha.com/res.php?key=${config.api_key}&action=get&id=${captcha_id}&json=1`,
    });
    captcha_status = JSON.parse(captcha_status);
    if (captcha_status.status == 1)
      return console.log("O Captcha resolvido:", captcha_status.request);
    else if (captcha_status.request != "CAPCHA_NOT_READY")
      return console.log("O captcha falhou!");
  }
}
