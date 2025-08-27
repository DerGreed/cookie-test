import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

const app = express();
const PORT = 3000;
const USE_BODY_CLASS = false;

// Middleware
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));


function darkmode (theme) {
  let sheetname;
  switch (theme) {
    case 'dark':
      sheetname = 'darkmode';
      break;
    default:
      return '';
  }

  return `
    <head>
      <link type="text/css" rel="stylesheet" href="/styles/${sheetname}.css">
    </head>
  `;
}

const HEAD = `
  <head>
    <link type="text/css" rel="stylesheet" href="/styles/style.css">
  </head>
`;

const body = (theme, innerHtml) => `
  <body${theme == 'dark' && ' class="darkmode"'}>
    ${innerHtml}
  </body>
`;

const addTheme = (theme, html) =>
  USE_BODY_CLASS ?
  HEAD + body(theme, html) :
  darkmode(theme) + html
;

// Startseite
app.get("/", (req, res) => {
  const username = req.cookies.username;
  const theme = req.cookies.theme || 'light';

  let html;
  if (username) {
    html = `
      <h1>Willkommen zurück, ${username}!</h1>
      <p>Aktuelles Theme: ${theme}</p>
      <a href="/settings">Einstellungen</a> |
      <a href="/logout">Logout</a>
    `;
  } else {
    html = `
      <h1>Hallo Gast!</h1>
      <form method="POST" action="/login">
        <input type="text" name="username" placeholder="Benutzername" required />
        <button type="submit">Login</button>
      </form>
    `;
  }
  res.send(addTheme(theme, html));
});

// Login → Cookie setzen
app.post("/login", (req, res) => {
  const { username } = req.body;
  res.cookie("username", username, {
    httpOnly: true,
    maxAge: 1000 * 60 * 15, // 15 Minuten
    secure: false, // Nur für Development auf HTTP
  });
  res.redirect("/");
});

// Einstellungen
app.get("/settings", (req, res) => {
  const theme = req.cookies.theme || 'light';
  const html = `
    <h1>Einstellungen</h1>
    <form method="POST" action="/theme">
      <label>Theme auswählen:</label>
      <select name="theme">
        <option value="light" ${theme === 'light' ? 'selected' : ''}>Hell</option>
        <option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dunkel</option>
      </select>
      <button type="submit">Speichern</button>
    </form>
    <a href="/">Zurück</a>
  `;
  res.send(addTheme(theme, html));
});

// Theme ändern
app.post("/theme", (req, res) => {
  const { theme } = req.body;
  res.cookie("theme", theme, {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 Tage
  });
  res.redirect("/settings");
});

// Logout → Cookie löschen
app.get("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/");
});

// app.get('/style.css', function(req, res) {
//   res.sendFile("./style.css");
// });

app.use('/styles', express.static('styles'))

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});