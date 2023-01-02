# Artwork Exhibition Web Application

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Pug](https://img.shields.io/badge/Pug-FFF?style=for-the-badge&logo=pug&logoColor=A86454)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

## What is this application?

This application allows for client to create account to view artwork stored on a MongoDB database. It also allows clients to add artwork to the database, follow artists and sign-up for workshops hosted by artists.

## Choice of programming languages and frameworks
The website was primarily made using JavaScript and Express. I used Express as my web framework of choice for the following reasons:

- Express is a lightweight and minimalistic framework, which makes it easy to get started with and provides a lot of flexibility in how you structure your application. This can be particularly appealing for small projects such as this one.
- Express is built on top of Node.js, which is a popular runtime environment for building scalable and high-performance web applications. This means that Express applications can be easily scaled to handle a large number of requests and can make efficient use of server resources.
- Express has a large ecosystem of middleware and plugins that can be easily integrated into your application. This can make it easier to add additional functionality and customize your application to meet your specific needs.

Alongisde JavaScript and Express, I also use Pug, which is a template engine. I chose this over using raw HTML files as it allows for easy integration with JavaScript objects and arrays.

## Video of the application running:
![](https://user-images.githubusercontent.com/81977350/210188116-35722240-71bd-4df2-bf6a-4354a344cc34.gif)

## Instructions to compile and run the application
1. Make sure to download the latest version of [Node.js and npm](https://nodejs.org/en/download/)
2. Download the source code or clone the repository.
3. First, install the necessary dependencies and packages using the following command in a terminal in the root directory of the program: `npm install`
4. Initialize the database by running the database initializer script using the following command in a terminal in the root directory of the program: `node database-initialization.js`
5. Finally, initialize the server using the following command in a terminal in the root directory of the program: `node server.js`
6. The server will initialize and you can open the home page of the website by typing `http://localhost:3000/` in a browser.

## Potential Improvements and Advancements
- Implementing a more modular framework like ReactJS to make the application more portable.
- Updating the CSS to make it more user-friendly on portable and mobile devices. 
