# Park Pulse

Park Pulse is a smart parking web application built with Node.js, Express, HTML, CSS, and JavaScript. It lets drivers create a parking profile, view live slot availability, reserve a slot, cancel an active booking, and review their parking history.

## Features

- Responsive blue and cyan smart-parking dashboard
- Vehicle profile registration with single-choice vehicle types
- Live availability for 16 parking spaces
- Parking duration and price calculation
- Slot booking and cancellation
- Current booking and parking-history views
- JSON API powered by Express
- Isolated chatbot microfrontend built as a native Web Component
- Multi-page journey: Home, How it works, About, and Parking Dashboard
- DDA link and no image or video file dependencies

## Microfrontend chatbot

The support chatbot lives in `public/microfrontends/chatbot.js`. It is a self-contained Web Component with its own markup, styling, lifecycle, and read-only live-slot API call. This keeps it separate from the parking dashboard and lets it be reused or independently developed later.

## Run locally

1. Install [Node.js](https://nodejs.org/).
2. Open a terminal in this project folder.
3. Install dependencies:

   ```powershell
   npm install
   ```

4. Start the website:

   ```powershell
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Project structure

```text
park-pulse/
├── public/
│   ├── index.html       # Website layout
│   ├── parking.html     # Registration, live slots, booking, and history
│   ├── how-it-works.html
│   ├── about.html
│   ├── style.css        # Responsive visual design
│   ├── pages.css        # Shared multi-page styles
│   └── script.js        # Browser interactions and API requests
├── server.js            # Express server and parking API
├── package.json
└── .gitignore
```

## API routes

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/register` | Create or update a parking profile |
| `GET` | `/api/slots` | Get all parking slots and rates |
| `POST` | `/api/book` | Reserve an available slot |
| `GET` | `/api/bookings/:customerId` | Get active bookings for a driver |
| `DELETE` | `/api/book/:bookingId` | Cancel a booking and release its slot |
| `GET` | `/api/history/:customerId` | Get a driver's booking history |

## Deploy on Render

1. Push this repository to GitHub.
2. In [Render](https://render.com), choose **New → Web Service**.
3. Select this GitHub repository and use:

   ```text
   Language: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. Render provides a public `onrender.com` URL after deployment.

> The current app stores bookings in a local JSON file under `data/`. That is suitable for local development. A production deployment should use a database, because a cloud service may clear local files when it restarts or redeploys.

## Update GitHub

After making changes:

```powershell
git add .
git commit -m "Describe your changes"
git push
```

## License

This project is available for learning and personal use.
