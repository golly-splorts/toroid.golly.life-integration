(function () {

  var Navbar = {

    baseApiUrl : getBaseApiUrl(),
    baseUIUrl : getBaseUIUrl(),

    init : function() {

      ///////////////////////////
      // Navbar

      // get current day/season info from API /today
      var modeUrl = this.baseApiUrl + '/mode';
      fetch(modeUrl)
      .then(res => res.json())
      .then((modeApiResult) => {

        var navbarSeasonDropdown = document.getElementById('navbar-season-dropdown-menu');
        var navbarPostseasonDropdown = document.getElementById('navbar-postseason-dropdown-menu');

        if (!modeApiResult.hasOwnProperty('season')) {
          throw "Could not find required property (season) in response from /mode API";
        }

        // top level div element
        var navbarSeasonDropdownDiv = document.createElement('div');
        var navbarPostseasonDropdownDiv = document.createElement('div');

        navbarSeasonDropdownDiv.classList.add('row');
        navbarPostseasonDropdownDiv.classList.add('row');

        navbarSeasonDropdownDiv.style.width = '400px';
        navbarPostseasonDropdownDiv.style.width = '400px';

        // ul element
        var navbarSeasonDropdownUl = document.createElement('ul');
        var navbarPostseasonDropdownUl = document.createElement('ul'); 

        navbarSeasonDropdownUl.classList.add('list-unstyled');
        navbarPostseasonDropdownUl.classList.add('list-unstyled');

        navbarSeasonDropdownUl.classList.add('col-md-6');
        navbarPostseasonDropdownUl.classList.add('col-md-6');

        var season0;
        for (season0 = 0; season0 <= modeApiResult.season; season0++) {

          var sp1 = parseInt(season0) + 1;

          var navbarSeasonDropdownLiElem = document.createElement('li');
          var navbarPostseasonDropdownLiElem = document.createElement('li');

          // Make Season link for season dropdown
          var aElem;
          aElem = document.createElement('a');
          aElem.classList.add('dropdown-item');
          aElem.setAttribute('href', baseUIUrl + '/season.html?which_season=' + sp1);
          aElem.innerHTML = 'Season ' + sp1;

          // Append li to ul
          navbarSeasonDropdownLiElem.appendChild(aElem);
          navbarSeasonDropdownUl.appendChild(navbarSeasonDropdownLiElem);

          // Make Season link for postseason dropdown
          aElem = document.createElement('a');
          aElem.classList.add('dropdown-item');
          aElem.setAttribute('href', baseUIUrl + '/season.html?which_season=' + sp1);
          aElem.innerHTML = 'Season ' + sp1;

          // Append li to ul
          navbarPostseasonDropdownLiElem.appendChild(aElem);
          navbarPostseasonDropdownUl.appendChild(navbarPostseasonDropdownLiElem);

          if (sp1%12 == 0) {

            // This season is the start of a new column,

            // Tack on the old ul column:
            navbarSeasonDropdownDiv.appendChild(navbarSeasonDropdownUl);
            navbarPostseasonDropdownDiv.appendChild(navbarPostseasonDropdownUl);

            // Make a new ul column:
            var navbarSeasonDropdownUl = document.createElement('ul');
            var navbarPostseasonDropdownUl = document.createElement('ul'); 

            navbarSeasonDropdownUl.classList.add('list-unstyled');
            navbarPostseasonDropdownUl.classList.add('list-unstyled');

            navbarSeasonDropdownUl.classList.add('col-md-6');
            navbarPostseasonDropdownUl.classList.add('col-md-6');
          }
        }

        navbarSeasonDropdown.appendChild(navbarSeasonDropdownDiv);
        navbarPostseasonDropdown.appendChild(navbarPostseasonDropdownDiv);

      })
      .catch(err => {
        console.log('Encountered an error while calling /mode');
        console.log(err);
        //this.error(-1);
      }); // end /seeds api call
    },

    /**
     * Register Event
     */
    registerEvent : function (element, event, handler, capture) {
      if (/msie/i.test(navigator.userAgent)) {
        element.attachEvent('on' + event, handler);
      } else {
        element.addEventListener(event, handler, capture);
      }
    },

  };

  Navbar.registerEvent(window, 'load', function () {
    Navbar.init();
  }, false);

}());
