# Pizza Ordering Node.js

Example project for creating an API endpoint and a CLI interface with node.js, aswell as a frontend client with the following features:

- Create a user
- Add pizzas to a cart
- Make an order and handle transactions using Stripe
- Send an email receipt using Mailgun

Access to the API is managed with a token with a default expiry of one hour. No npm packages were used in this application.

## Installation

```
git clone git@github.com:Rinbo/pizza-ordering-nodejs.git
cd pizza-ordering-nodejs
mkdir https && mkdir .data && mkdir .data/carts && mkdir .data/tokens && mkdir .data/users
```

#### Generate an ssl certificate and rsa key:

```
cd https
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem

```

#### Add API keys to config.js

The applicaiton is making use of Stripe and Mailgun. Visit their respective websites and set up your accounts. Then grab the api-keys and add them to config.js

- https://www.mailgun.com/
- https://stripe.com/se

## Usage

#### Start up server in staging:

```
NODE_ENV=staging node index.js
```

Server will listen on ports 3000 and 5000 for http and https request respectively

#### Start up server in production:

```
NODE_ENV=production node index.js
```

Server will listen on ports 3001 and 5001 for http and https request respectively

## Frontend

- Sign up to the service
- Add Pizzas to the cart
  ![menu png](https://user-images.githubusercontent.com/37734235/52374074-99f77500-2a5c-11e9-9b88-fa32161f5202.jpg)
- Review your order and then fill in your credit card details
  ![checkout png](https://user-images.githubusercontent.com/37734235/52374078-9c59cf00-2a5c-11e9-910c-89abb3c2559a.jpg)
- If the Stripe Payment went throught you will be emailed a receipt and a modal will display the some useful info
  ![success png](https://user-images.githubusercontent.com/37734235/52374084-9e239280-2a5c-11e9-8911-743a2d1b9ab7.jpg)

## API Section

#### Requests

The below instructions assumes requests to staging server on port 3000

**Create a user:**

```
POST http://localhost:3000/users
body: {
  "email": "your_email@example.com",
  "password": "yourPassword",
  "firstName": "name",
  "lastName": "name",
  "streetAddress", "yourAddress"
}
```

**"Login" by creating a token** (expires after one hour)

```
POST http://localhost:3000/tokens
body: {
  "email": "your_email@example.com",
  "password": "yourPassword"
}
```

**Save the returned token in your headers:**

```
headers: {
  "Content-Type": "application/json",
  "Token: "your_token"
}
```

You can now make GET, POST, PUT and DELETE requests to the follwing endpoints:

```
http://localhost:3000/tokens
http://localhost:3000/users
http://localhost:3000/carts
```

In addition you can make a POST request to :

```
http://localhost:3000/order
```

and a GET request to:

```
http://localhost:3000/menu
```

**Example workflow for ordering a pizza (Given you have created a user and posted the token in headers)**:

**Get the menu:**

```
GET http://localhost:3000/menu
```

**Choose some pizzas and add them to the cart by creating it:**

```
POST http://localhost:3000/carts
{
	"email":"your_email@example.com",
	"password":"yourPassword",
	"pizzas":[1,3],
	"amounts":[2,2]
}
```

The 'pizzas' array contains the id of the pizza you want.
The 'amounts" array should contain the amount of pizzas you want where the indicies must match.

**Make an order:**

```
POST http://localhost:3000/order
{
	"email":"your_email@example.com",
	"cartToken":"tok_visa"
}
```

Note: **'tok_visa'** is a placholder for valid credit card information and will naturally only work in a sandbox environment.

That's it. The order will be placed and you will receive a reciept of the transaction to your inbox.

## CLI Interface

After starting the app, interface with it through the CLI. The following actions are currently available:
