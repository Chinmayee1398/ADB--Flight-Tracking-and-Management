/* Driver.js */
const driverG = window.driver.js.driver;

/* Highlight searchbar on focus
$('#inp').on("focus", () => {
    driverG({
        overlayColor: 'transparent',
    }).highlight({
        element: '#inp',
        popover: {
           title: "Info",
           description: "<h3>Enter the ICAO code to get history '[query]10'</h3>",
        },
        side: 'bottom',
        align: 'start'
    });
}); */

/* Welcome message on load */
/*driverG({
    animate: true, // Enable animations
    opacity: 0.75, // Set overlay opacity
    showButtons: ['next', 'close'],
    doneBtnText: 'Lessss go!',
    steps: [
        {
            popover: {
                title: 'Welcome!',
                description: "<img src='https://i.imgur.com/EAQhHu5.gif' style='height: 202.5px; width: 270px;'><p>Welcome to our page!</p>",
                //description: "<p>Welcome to our page!<br>You can track live weather details from here.</p>",
                position: 'center'
            },
            highlight: false // Disable highlighting
        },
    ]
}).drive();*/

const driver2 = driverG({
      overlayOpacity: 0.75,
      onNextClick: () => {
         driver2.destroy();
      },
      onCloseClick: () => {
         driver2.destroy();
      },
   });


   /*driver2.highlight({
      popover: {
         title: 'Welcome!',
         description: "<img src='https://i.imgur.com/EAQhHu5.gif' style='height: 202.5px; width: 270px;'><p>Welcome to our page!</p>",
         position: 'center',
         showButtons: ['next', 'close'],
         nextBtnText: 'Lessss go!',
      }
   })*/
