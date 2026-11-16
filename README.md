# Shift Request

One file. Front end only, no server, no install, no internet.

Drivers pick a start time, see the routes on offer and submit a request. Planners keep the contracts, the start times and the routes, and see the requests that were submitted.

Built for the Severn Beach operation. TK MAXX, PALL, WICKES, DUNELM and B&M are the contracts, and a "location" is a route expressed as store number and town, for example `396 YEOVIL > 441 BARNSTAPLE`.

## Opening it

Double click `shift-request.html`. Any browser, desktop or phone. Email the file to a colleague and it works for them too.

## Driver side

Start time comes first, contract second.

- **Start time** lists every slot the planner has set up. Routes appear the instant a slot is picked.
- **Contract** defaults to `All contracts`, so routes are on screen the second the page loads.
- **Blank means blank.** If nothing runs the chosen contract at the chosen time, the list stays empty. No filler, no suggestion.
- Tap a route. It is named back under **Request this route**, and the **Submit request** button comes alive.
- Add your name, a date and an optional note, then hit **Submit request**.

The submit button is always on screen. It sits greyed out until a route is picked, so there is nothing to hunt for.

Every device gets a four character code on first use, shown at the top of the page. That code travels with each request, so the planner can tell two people with the same first name apart.

## Planner side

- **Coverage** is every contract against every start time. A number means routes exist, a blank cell means nothing is running. Tap any cell to add a route for exactly that contract and time.
- **Start times** are the slots a driver can choose from. They can exist before any route does.
- **Contracts** are the permanent list. A contract with no routes stays on the list and shows nothing next to it.
- **Routes** are added with a contract, a start time, a trip pattern and the stops in order.
- **Requests** is every request submitted on this device, with the driver, the date, the code and the note.
- **Backup** exports and imports the whole dataset, routes and requests together.

Trip pattern is one of two things, in your words: `One trailer, all in one`, or `Drop A, reload, drop B`.

## Getting a request to the planner

There is no server, so a request lives on the device that made it. Two ways across:

- **Send it on**, which appears next to Submit once a route is picked. It uses the phone's own share sheet, so it goes straight into WhatsApp, Messages or email. Works on phones, not on most desktops.
- **Export a copy** on the driver's device, **Import a copy** on the planner's.

The read only box under the submit button always shows the full request text, so it can be selected by hand if nothing else works.

## Where the data lives

In the browser storage of whichever browser you opened the file in. Nothing is uploaded anywhere.

Use the same browser and the same file location each time, or the lists look empty. Export a copy now and then, because clearing browser data wipes it.

## Filling in the real data

One route is real, taken from a schedule email: TK MAXX, 04:15, 396 YEOVIL > 441 BARNSTAPLE, one trailer all in one. The five contract names came from you. Everything else has to be entered, because none of it exists on this machine.

Add the routes you know for certain and leave the rest. A short accurate list beats a long guessed one.

## Keeping it safe

Keep the file and any backup off shared drives and off public web hosts. Real contract names, route numbers and store towns are commercially sensitive, and the contract clauses on confidentiality and outside work are easy to trip over by accident.

## Checking it still works

```
node verify.mjs
```

Runs the page's real script against a fake browser and checks the behaviour that matters: routes appear from the available start time, a contract with no routes stays blank, submit stays disabled until a route is picked, submitting records the request for both driver and planner, and the coverage grid counts correctly. Twenty nine checks, exits non-zero on any failure. Run it after any edit.

## If you ever want it shared across phones

That needs a backend, which was built and then removed on purpose. The work is not lost: the request payload already carries the device code, the driver, the contract, the start time, the route label, the stops, the note and a timestamp, so a server only has to receive that object. Say the word and it goes back in.
