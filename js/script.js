let  map;
let service;
let infowindow;
let click = false;
let googleId = '';
let latitude = 40.7527;
let longitude = -73.9772;
let googlePhoneInt;
let postSearchContainerHeight;
let yelpStarImage;
let cors =  'https://cors-anywhere.herokuapp.com/';
let googleApiKey = config.googleApiKey;
let yelpClientId = config.yelpClientId;
let firebaseApiKey = config.firebaseApiKey;
let googleScriptSrc = config.googleScriptSrc;
let googleStars = '<span class="fas fa-star"></span>';
let reviewToDeleteGlobal = null;

//callback in script tag (line18) initializes Google Maps with default query specified
function initMap(query = 'Grand Central Station') {
     let location = new google.maps.LatLng(latitude, longitude);
     infowindow = new google.maps.InfoWindow();
     map = new google.maps.Map(
     document.getElementById('map'), {center: location, zoom: 13}); 
     var request = {
          query: query,
          fields: ['name', 'geometry', 'formatted_address', 'place_id'],
     };

     //on submit run initMap again with query / input value
     $('#submit').click(function(event){
          event.preventDefault();
          value =  $('#search-input').val();
          initMap(value);
          $('.loader-container').show(); 
     });

     service = new google.maps.places.PlacesService(map);
     //creates markers for the results of the query and returns info (makes api calls) for the first of those results (if more than one)
     service.findPlaceFromQuery(request, function(results, status) {
          console.log(results[0]);
          //if no results are returned from the query error handler
          if (results[0] === null) {
               $('.loader-container').hide();
               alert(value + ' was not found. Please, try a different query');
               return;
          }
          if (status === google.maps.places.PlacesServiceStatus.OK) {
               for (var i = 0; i < results.length; i++) {
                    createMarker(results[i]);
                    googleId = '';
                    googleId = results[0].place_id;
                    $('#submit').attr('data-input', googleId);
               }
               map.setCenter(results[0].geometry.location);
               googleGet();
          }
     });

     function createMarker(place) {
          var marker = new google.maps.Marker({
               map: map,
               position: place.geometry.location
          });
          
          //when the map marker is clicked on, add place name and address to the infowindow and open. get googleId and initiate api call for business at the marker location
          google.maps.event.addListener(marker, 'click', function(event) {
               infowindow.setContent(place.name +  '<br>' + place.formatted_address);
               infowindow.open(map, this);
               googleId = '';
               googleId = place.place_id;
               latitude = place.geometry.location.lat();
               longitude = place.geometry.location.lng();
               $('#submit').attr('data-input', googleId);
               googleGet();
          });     
     }
}

//googleGet requires the googleId parameter from initMap to get the reviews and review info for the place queried
function googleGet() {
     let googleApiKeyParam = 'key=' + googleApiKey + '&';
     let placeIdParam = googleId;
     let herokuApp = 'https://accesscontrolalloworiginall.herokuapp.com/';
     let googleApiUrl = 'https://maps.googleapis.com/maps/api/place/details/json?';
     let placeIdKeyParam = 'place_id=' + placeIdParam;
     let language = 'language=en&';
     let url =  herokuApp + googleApiUrl+ googleApiKeyParam + language + placeIdKeyParam;
     fetch(url)
     .then(jsonGoogleConvert)
     .then(jsonGoogleAppend)
     .then(getSubmittedReview)
     .catch((error) => {console.log(error)});
}

//error response Google Place Call
function jsonGoogleConvert(response) {
     if (response.ok) {
          console.log('ok');
          return response.json();
     }
     else {
          alert('Google API went wrong');
     }
}

//appends all the google places info into google-div
function jsonGoogleAppend(jsonData){
     console.log(jsonData.result);
     console.log( jsonData.result.formatted_phone_number);
     //when only a phone number returns but no reviews
     function onlyPhoneNumberAppend() {
          $('#google-data').append('<div class="google-reviews-info"><h2 class="google-name">' + jsonData.result.name+ '<br>' + (jsonData.result.formatted_address).substr(0, (jsonData.result.formatted_address).indexOf(',')) + '<br>' +  (jsonData.result.formatted_address).substr((jsonData.result.formatted_address).indexOf(',') + 1) + '<br>' +  jsonData.result.formatted_phone_number + '</h2><h3 class="google-rating">no reviews &#9785;</h3></div>');
     }
     //when neither review nor phone number returns
     function noPhoneAndNoReviewsAppend() {
          $('#google-data').append('<div class="google-reviews-info"><h2 class="google-name">' + (jsonData.result.formatted_address).substr(0, (jsonData.result.formatted_address).indexOf(',')) + '<br>' +  (jsonData.result.formatted_address).substr((jsonData.result.formatted_address).indexOf(',') + 1) + '</h2><h3 class="google-rating">no reviews &#9785;</h3></div>');
     }
     //error handling for if there is no google review data or/and no phone number data returned in the call (this is a giant block. it is horrible(moved append blocks into function to reduce the block))
     if (isNaN(jsonData.result.rating) || jsonData.result.formatted_phone_number === undefined) {
          $('.loader-container').hide(); 
          $('#google-data div, #google-data-reviews, #yelp-data div, #yelp-data, #yelp-link ul, #yelp-data-reviews div, #yelp-data-reviews, #message-div p, #review-board').html('');
          $('#yelp-data').append('<h3 class="yelp-rating">no reviews &#9785;</h3>');
          $('.google-rating').css({'bottom-margin': '2em', 'font-weight': '600'})
          if (isNaN(jsonData.result.rating) && jsonData.result.formatted_phone_number !== undefined) {
               onlyPhoneNumberAppend();
          }
          if (isNaN(jsonData.result.rating) && jsonData.result.formatted_phone_number === undefined) {
               noPhoneAndNoReviewsAppend();
          }
          $('#business-name').html($('.google-name').html());
          return;
     }
     googlePhoneInt = (jsonData.result.international_phone_number.replace(/-|\s/g,""));
     let addressNewLineIndex =  (jsonData.result.formatted_address).indexOf(',');
     let googleAddress1 = (jsonData.result.formatted_address).substr(0, addressNewLineIndex);
     let googleAddress2 = (jsonData.result.formatted_address).substr(addressNewLineIndex + 1);
     let googlePhone = jsonData.result.formatted_phone_number;
     let googleName = jsonData.result.name;
     let googleUrl = jsonData.result.url;
     let googleRating = ((Math.round(jsonData.result.rating * 2) / 2).toFixed(1)) ;
     let googleRatingCalc = ((Math.round(jsonData.result.rating * 2) / 2).toFixed(1)) -1;
     let emptyStars = 4 - (Math.ceil(googleRatingCalc));
     googleStars = '<span class="fas fa-star"></span>';
     //appends html to googleStars to display review
     googleStarsCalc(googleRatingCalc, emptyStars);
     let googleTotalReviews = Number(jsonData.result.user_ratings_total).toLocaleString();
     let googleReviewAuthor = [];
     let googleReviewerRating = [];
     let  googleReviewText = [];
     let  googleReviewTime = [];
     let googleRevRating = [];

     $('#google-data div').remove();
     $('#google-data-reviews div').remove();
     $('#google-link ul').remove();
     //append Google place info
     $('#google-data').append('<div class="google-reviews-info"><h2 class="google-name">' + googleName + '<br>' + googleAddress1 + '<br>' + googleAddress2+ '<br>' + googlePhone + '</h2><h3 class="google-rating">' + googleStars + '</h3><p id="google-review-number">' + googleRating + ' Stars</p><p class="google-total-number-reviews">Out of ' + googleTotalReviews + ' reviews</p></div>');
     $('#google-link').append('<ul><li><a  target="_blank" href="' + googleUrl + '">More on Google</a></li></ul>');

     //append google reviews
     for (i=0; i < jsonData.result.reviews.length; i++) {
          googleReviewAuthor[i] = jsonData.result.reviews[i].author_name;
          googleRevRating[i] = (jsonData.result.reviews[i].rating);
          googleReviewerRating[i] =  (jsonData.result.reviews[i].rating) -1;
          let emptyStarsReview = 4 - (googleReviewerRating[i]);
          googleStars = '<span class="fas fa-star"></span>';
          //appends html to googleStars to display review
          googleStarsCalc(googleReviewerRating[i], emptyStarsReview);

          googleReviewText[i] = jsonData.result.reviews[i].text;
          googleReviewTime[i] = jsonData.result.reviews[i].relative_time_description;
          $('#google-data-reviews').append('<div class="google-reviews-data"><h3 class="google-author">' + googleReviewAuthor[i]  + '</h3><p class="google-reviewer-rating">' + googleStars +  '</p><p class="google-review-rating">' + googleRevRating[i]   + ' Stars</p><p class="google-review">' + googleReviewText[i] +  '</p><p class="google-review-time">Written ' + googleReviewTime [i]+ '</p></div>');
     }
     $('#business-name').html($('.google-name').html());
     firstYelpCall();
}

//firstYelpCall uses phone number (international format with some reformatting to fit specs) from google place api call and some of the data (not the reviews(second yelp call)) is appended. this gets yelpBusinessAlias which is a necessary key/value to get the relevant reviews for the business in the second call
function firstYelpCall() {
     console.log(googlePhoneInt);
     let phoneParam = 'phone=' + googlePhoneInt;
     let yelpApiUrl1 = "https://api.yelp.com/v3/businesses/search/phone?";
     var settings = {
          "url": cors + yelpApiUrl1 + phoneParam + "&" + yelpClientId,
          "method": "GET",
          "timeout": 0,
          "headers": {
          "Authorization": "bearer A3lSJ2uBVPDQoRdUaGOWRhAw378Ga00WWuyF1OWEwEGYaj4OU5zF5NRjWey7RMhi-K8DYFgwSqbL3THCjIT6hlFG-UT10XGT1E7qqGWhhVyYkKO8ez0iI1s9ov38XXYx "
          },
     };
     $.ajax(settings).done(function (response) {
          console.log('yelp success');
          console.log(response);
          console.log(response.businesses[0]);
          if (response.businesses[0] === undefined) {
               $('#yelp-data div, #yelp-data, #yelp-link ul, #yelp-data-reviews div, #yelp-data-reviews').html('');
               $('#yelp-data').append('<h3 class="yelp-rating">no reviews &#9785;</h3>');
               return;
          }
          //error managing for condition where there is Google Info, an international phone number but no business alias(so second-yelp call won't be able to run)
          $('#yelp-data div').remove();
          $('#yelp-link ul').remove();
          $('.yelp-rating').html('');
          let yelpUrl = response.businesses[0].url;
          let yelpName = response.businesses[0].name;
          let yelpReviewCount = response.businesses[0].review_count;
          let yelpRating = response.businesses[0].rating;
          let yelpBusinessImage = response.businesses[0].image_url;
          let yelpBusinessAlias = response.businesses[0].alias;

          //gets appropriate yelpStarImage
          yelpStarsImageCalc(yelpRating);
          secondYelpCall(yelpBusinessAlias);
          $('#yelp-data').append('<div class="yelp-reviews-info"><h2>' + yelpName + '</h2><img id="star-rating" src="' + yelpStarImage + '" alt="yelp star rating"></img><h3 class="yelp-rating">' + yelpRating + ' Stars</h3><p class="yelp-total-number-reviews">Out of ' + yelpReviewCount + '</p></div>');
          $('#yelp-link').append('<ul><li><a target="_blank" href="' + yelpUrl + '">More on Yelp</a></li></ul>');
          $('.yelp-reviews-info').append('<img id="business-image" src="' + yelpBusinessImage + '" alt="yelp business image"></img>');
     }).fail(function (response) {
          console.log('Something went wrong');
     });
}

//second Yelp call uses the yelpBusinessAlias info from the first Yelp Call to get the yelp reviews for the business queried (only 3 partial ones :( )
function secondYelpCall(yelpBusinessAlias) {
     let yelpApiUrl2 = 'https://api.yelp.com/v3/businesses/';
     var settings2 = {
          'url': cors + yelpApiUrl2 + yelpBusinessAlias + '/reviews?' + yelpClientId,
          "method": "GET",
          "timeout": 0,
          "headers": {
          "Authorization": "bearer A3lSJ2uBVPDQoRdUaGOWRhAw378Ga00WWuyF1OWEwEGYaj4OU5zF5NRjWey7RMhi-K8DYFgwSqbL3THCjIT6hlFG-UT10XGT1E7qqGWhhVyYkKO8ez0iI1s9ov38XXYx"
          },
     };     
     $.ajax(settings2).done(function (response) {
          let yelpReviewsText = [];
          let yelpReviewsRating = [];
          let yelpReviewsTime = [];
          let yelpReviewerName = [];
          $('#yelp-data-reviews div').remove();
          for (i = 0; i < response.reviews.length; i++) {
               yelpReviewsRating[i] = response.reviews[i].rating;
               yelpReviewsText[i] = response.reviews[i].text;
               yelpReviewerName[i] = response.reviews[i].user.name;
               yelpReviewsTime[i] = (response.reviews[i].time_created).slice(0, 10);
               //gets appropriate yelpStarImage
               yelpStarsImageCalc(yelpReviewsRating[i]);

               $('#yelp-data-reviews').append('<div id="yelp-reviews-data"><h3 class="yelp-author">' + yelpReviewerName[i]  + '</h3><img id="star-rating" src="' + yelpStarImage + '" alt="yelp star rating"></img><p class="yelp-reviewer-rating">' + yelpReviewsRating[i] +  ' Stars</p><p class="yelp-review">' + yelpReviewsText[i] +  '</p><p class="yelp-review-time">On ' + yelpReviewsTime [i]+ '</p></div>');
          }
     }).fail(function (response) {
          console.log('Something went wrong');
     });
}

//firebase
var firebaseConfig = {
     apiKey: firebaseApiKey,
     authDomain: "reviews-52c2a.firebaseapp.com",
     databaseURL: "https://reviews-52c2a.firebaseio.com",
     projectId: "reviews-52c2a",
     storageBucket: "reviews-52c2a.appspot.com",
     messagingSenderId: "943215164287",
     appId: "1:943215164287:web:f49fd496da9d5c9e38784a"
};
firebase.initializeApp(firebaseConfig);
let backEndData  = firebase.database();

//on review-form submit save entered information to Firebase backend (businessId is saved so that the review only shows when the api query result matches the reviewed place)(submittedRating is saved here by extracting the html at the time of submission for the star-rating)
function reviewSubmitSave() {
     //alert if not all fields are filled in 
     if ($("#review").val() === '' || $('.reviewer-name').val() === '' || $('#review-select-stars').html() === '<span class="span-star">☆</span><span class="span-star">☆</span><span class="span-star">☆</span><span class="span-star">☆</span><span class="span-star">☆</span>') {
          alert('Please, add rating, review, and name before submitting.');
          return false;
     }
     event.preventDefault();
     var businessId = $('#submit').attr('data-input');
     var review = $("#review").val();
     var submittedRating = $('#review-select-stars').html();
     var submittedRatingNumber = $('#review-select-stars').attr('data-id');
     var reviewerName = $('.reviewer-name').val();
     $("#review").val("");
     
     let reviewsRef = backEndData .ref("reviews");
     reviewsRef.push({ 
          review: review,
          businessId: businessId,
          submittedRating: submittedRating,
          submittedRatingNumber: submittedRatingNumber,
          reviewerName: reviewerName
     });
     afterSubmitValueReset();
}
     
let getSubmittedReview=()=>{
          
     backEndData.ref("reviews").on("value", (results) => {
          let reviewsHidden = 0;
          let allStarsforPlace = 0;
          let keys = [];
          let reviews = [];
          let idArray = [];
          let ratingsArray = [];
          let reviewerNames = [];
          let ratingNumber = [];
          let reviewsData = results.val();
          //gets the info from the backend and pushes to array variables
          for(key in reviewsData) {
               keys.push(key);
               reviews.push(reviewsData[key].review);
               idArray.push(reviewsData[key].businessId);
               ratingsArray.push(reviewsData[key].submittedRating);
               ratingNumber.push(reviewsData[key].submittedRatingNumber);
               reviewerNames.push(reviewsData[key].reviewerName);
          }
          $('#review-board').html(''); 
          for (let i=0; i < reviews.length; i++) {
               //struggled here and same solution as line 435 worked (wasn't able to delete or update the last item displayed and click event wasn't firing)
               $('#review-board').on('click','.delete-button', deleteReview);
               $('#review-board').on('click','.update-button', updateReview);
               //appends html with submitted review data
               $('#review-board').append('<div class="submit-review"><div class="appended-review-stars review-select-div" data-id="' + ratingNumber[i] +  '">' + ratingsArray[i] + '</div><pre class="review-p">' + reviews[i] + '</pre><p class="name-p">' + reviewerNames[i] + '</p><button class="delete-button" data-id="' + keys[i] + '"data-input="' + idArray[i] + '"><i class="fas fa-trash-alt" title="delete review"></i></button><button  class="update-button" data-id="' + keys[i] + '"><i class="fas fa-pencil-alt" title="update review"></i></button>');
          }
          //for each query a unique googleId is added to #submit data-input(line 37 & 57). this is saved in the database at the time of submission and appended to the .delete-button. this only shows the review when the Google Ids match (review was written for the business currently being queried)( this method won't work well on a large scale :( )
          for (let i=0; i < ($('.submit-review').length); i++) {
               if ($('#submit').attr('data-input') !== $('.delete-button').eq(i).attr('data-input')) {
                    $('.submit-review').eq(i).hide();
                    reviewsHidden ++;
               }
               //if the review is not hidden and is for the current place then add up the ratings(to divide later by total reviews shown)
               else {
                    allStarsforPlace += Number($('.appended-review-stars').eq(i).attr('data-id'));
               }
               //needed to put this in the flow to delete it after a new review was submitted(not ideal :( )
               if (reviewToDeleteGlobal !== null) {
                    reviewToDeleteGlobal.remove();
                    reviewToDeleteGlobal = null;
               }
          }
          //outOfReviews calculates the number of reviews shown by taking the number of total reviews and subtracting the number that is hidden (reviewsHidden ++).  fullNumber calculates the average review by dividing the ratings added together by the number of ratings for the current place queried.
          let outOfReviews = (($('.submit-review').length) - reviewsHidden);
          let fullNumber = (Number(Math.round((allStarsforPlace / outOfReviews ) * 2) / 2).toFixed(1)) - 1;
          let emptyNumber = 4 - (Math.ceil(fullNumber));
          googleStars = '<span class="fas fa-star"></span>';
          googleStarsCalc(fullNumber, emptyNumber);
          if (outOfReviews > 0) {
               setTimeout(function(){ 
                    $('#average-review-rating').html(googleStars);
                    $('#average-review-rating-nr').html(fullNumber + 1 + ' stars');
                    $('#average-review-rating-out-of').html('out of ' + outOfReviews + ' reviews');
               }, 300);
          }
          else {
               $('#average-review-rating').html('');
               $('#average-review-rating-nr').html('');
               $('#average-review-rating-out-of').html('');
          }
     })
     $('.loader-container').hide();          
}

//deletes review on delete button click
function deleteReview(event) {
     let key = $(this).attr('data-id');
     let reviewToDelete = backEndData.ref("reviews/" + key);
     reviewToDelete.remove();
}

//updates review on review button click
function updateReview(event) {
     let reviewerName = $(event.currentTarget.parentElement).find('.name-p').text();
     $('#review-div').scrollTop('0px');
     $('.reviewer-name').val(reviewerName);
     $('#write-review-btn').click();
     event.preventDefault;
     let key = $(this).attr('data-id');
     let reviewToDelete = backEndData.ref("reviews/" + key);
     reviewToDeleteGlobal = reviewToDelete;
}

//calculates html necessary to display google star rating
function googleStarsCalc(rating, empty) {  
     while (rating > 0) {
          googleStars += '<span class="fas fa-star"></span>';
          rating -= 1;
          if (rating === 0.5) {
               googleStars += '<span class="fas fa-star-half-alt"></span>';
               rating -= 0.5;
          }
     }
     while (empty > 0) {
          googleStars += '<span class="far fa-star"></span>';
          empty -= 1;
     }
}

//gets yelp stars image to append to src on image based on rating
function yelpStarsImageCalc(rating) {
     yelpStarImage =
          (rating === 5) ? './images/small_5.png'
          :(rating === 4.5) ?  './images/small_4_5.png'
          :(rating === 4) ?  './images/small_4.png'
          :(rating === 3.5) ?  './images/small_3_5.png'
          :(rating === 3) ?  './images/small_3.png'
          :(rating === 2.5) ?  '../images/small_2_5.png'
          :(rating === 2) ?  './images/small_2.png'
          :(rating === 1.5) ?  './images/small_1_5.png'
          : './images/small_1.png';
}

//press enter key simulates submit button clicked when input is in focus
function submitQuery(event) {
     event.preventDefault();
     if (event.keyCode === 13 && $('#search-input').is(':focus')) {
          document.getElementById('submit').click();
     }
}

//when the Yelp button is clicked
function yelpClick() {
     $('#yelp-button').css('background-color', '#D0D0D0');
     $('#yelp-div').show();
     $('#google-div, #review-div').hide();
     $('#google-button, #comments-button').css('background-color', '#F0F0F0');
}

//when Google button is clicked
function googleClick() {
     $('#google-button').css('background-color', '#D0D0D0');
     $('#google-div').show();
     $('#yelp-div, #review-div').hide();
     $('#yelp-button, #comments-button').css('background-color', '#F0F0F0');
}

//when comments button is clicked
function commentClick() {
     $('#comments-button').css('background-color', '#D0D0D0');
     $('#review-div').show();
     $('#yelp-div, #google-div').hide();
     $('#yelp-button, #google-button').css('background-color', '#F0F0F0');
     $('#review-form').hide();
     $('#write-review-btn').click(function(){
          $('#review-form').show();
     });
}

//animation effects for when the toggle-button is clicked (added a google-button click here as it recenters the map (recalculates height on click))
function toggleSidePanel() {
     $('#toggle-button i').toggleClass('fa-caret-left').toggleClass('fa-caret-right');
     $('#toggle-button-div').toggleClass('left-position-toggle');
     $('#post-search-pop-up').toggle('fast', function() {
          $('#google-button').click();
     });
}

//voids the input value when input container is clicked
function voidInput() {
     $('#search-input').val('');
}

//changes the html that composes the stars in the review section. depending on which star (index(this)) of the current html was clicked, that choice is reflected. when the user submits the review, the html comprising the stars is saved to show the user's rating along with their review
function ratingSelected(event) {
     let starClickedFill = 5 - (parseFloat($('.span-star').index(this)));
     let starClickedVoid = (parseFloat($('.span-star').index(this)))
     let fullStars = '';
     let voidStars = '';
     $('#review-select-stars').html('');
     for (let i = 0; i < starClickedFill; i++) {
          fullStars += '<span class="span-star">&#9733;</span>';
     }
     for (let i = 0 ; i < starClickedVoid; i++) {
          voidStars +=  '<span class="span-star">&#9734;</span>';
     }
     $('#review-select-stars').html(voidStars + fullStars);
     $('#review-select-stars').attr('data-id', starClickedFill);
}

//calculates the height of the side-div. this is required for creating the scroll-bar on the element (tried subtracting the height of the buttons from the container-height, but it kept coming out just too short)
function getSideBarHeight() { 
     if ((((window.matchMedia('(max-width: 768px)').matches)) && ((window.matchMedia('(orientation: portrait)').matches)))) {
          postSearchContainerHeight  = (($('#map-container').height()) - 215) + 'px'; 
     }
     if ((((window.matchMedia('(max-width: 1024px)').matches)) && ((window.matchMedia('(orientation: landscape)').matches)))) {
          postSearchContainerHeight  = (($('#map-container').height()) - 125) + 'px'; 
     }
     else {
          postSearchContainerHeight  = (($('#map-container').height()) - 115) + 'px'; 
     }
     $('#google-div, #yelp-div, #review-div').css('height', postSearchContainerHeight);
}

//states of elements on load
function stateOnLoad() {
     $('#post-search-pop-up').hide();
     $('#toggle-button i').toggleClass('fa-caret-left', false).toggleClass('fa-caret-right', true);
     $('#toggle-button-div').toggleClass('left-position-toggle', true);
     $('.loader-container').show();
}

//after user submit reset review fields and hide review-form
function afterSubmitValueReset() {
     $('#average-review-rating').html('');
     $('#average-review-rating-nr').html('');
     $('#average-review-rating-out-of').html('');
     $("#review").val('');
     $('.reviewer-name').val('');
     $('#review-select-stars').html('<span class="span-star">☆</span><span class="span-star">☆</span><span class="span-star">☆</span><span class="span-star">☆</span><span class="span-star">☆</span>');
     $('#review-form').hide();
}

 //changes the color of the font-awesome on hover in the submit button
function submitButtonHoverEffect() {
     $("#submit").on({
          mouseenter: function () {
               $( '.fa-map-marker-alt').css('color', '#D0D0D0');
          },
          mouseleave: function () {
               $( '.fa-map-marker-alt').css('color', '#F0F0F0');
          }
     });
}

 //changes the size of the side-bar buttons on hover (tried hover color change in css but the specified button color change on click interfered so then changed hover color change to hover size change). need to find better workarounds for this problem
function resultsBarButtonsHoverEffect() {
     $('#results-bar button').on({
          mouseenter: function () {
               $(this).css({'height': '4.35em', 'width': '4.35em'});
          },
          mouseleave: function () {
               $(this).css({'height': '4em', 'width': '4em'});
          }
     });
}

function onReady() {
     submitButtonHoverEffect();
     resultsBarButtonsHoverEffect();
     getSideBarHeight();
     stateOnLoad();
     $('#yelp-button').click(yelpClick);
     $('#google-button').click(googleClick);
     $('#comments-button').click(commentClick);
     $('#toggle-button').click(toggleSidePanel);
     $('#search-input').click(voidInput);
     document.addEventListener("keyup", submitQuery);
     //had to do it this way because the click stopped functioning on .span-star changes in the function. learned something new. was sceptical
     $('#review-select-stars').on('click', '.span-star' , ratingSelected);
     $('.delete-button').click(deleteReview);
     $('.update-button').click(updateReview);
     $('#review-form').on('submit', reviewSubmitSave);
}

$('document').ready(onReady);


