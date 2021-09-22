(function () {

  var PostseasonPage = {

    baseApiUrl : getBaseApiUrl(),
    baseUIUrl : getBaseUIUrl(),

    mode : null,

    leagues : null,
    loadingElem : null,

    containers : [
      'season-header-container',
      'postseason-toc-container',
      'postseason-champion-container',
      'postseason-hcs-container',
      'postseason-lcs-container',
      'postseason-lds-container'
    ],

    init : function() {
      this.loading();
      this.loadConfig();
    },

    /**
     * Handle the case of an error, tell the user something is wrong
     */
    error : function(mode) {

      // Hide elements
      this.loading(false);

      for (var c in this.containers) {
        try {
          var elem = document.getElementById(this.containers[c]);
          elem.classList.add('invisible');
        } catch (e) {
          // do nothing
        }
      }

      // Show error 
      var container = document.getElementById('container-error');
      container.classList.remove("invisible");
    },

    /**
     * Show the site loading message while waiting for the API response
     */
    loading : function(show = true) {
      var loadingMessages = document.getElementsByClassName("loading-message");
      var m;
      for (m = 0; m < loadingMessages.length; m++) {
        var elem = loadingMessages[m];
        if (show) {
          // Reveal the loading message
          elem.classList.remove('invisible');
        } else {
          // Remove the loading message
          elem.remove();
        }
      }
    },

    /**
     * Load parameters from the URL (if any are specified)
     * and pass them along to the API-calling functions.
     */
    loadConfig : function() {

      // season parameter is zero-indexed
      var url_season = this.helpers.getUrlParameter('season');
      // which_season parameter is one-indexed
      var url_which_season = this.helpers.getUrlParameter('which_season');

      // Check current season and day
      let url = this.baseApiUrl + '/mode';
      fetch(url)
      .then(res => res.json())
      .then((modeApiResult) => {

        if (!modeApiResult.hasOwnProperty('season') || !modeApiResult.hasOwnProperty('mode')) {
          throw "Did not find required keys (mode, season) in API /mode response"
        }
        this.currentSeason = modeApiResult.season;
        this.mode = mode = modeApiResult.mode;

        if (url_which_season != null) {
          this.season = url_which_season - 1;
        } else if (url_season != null) {
          this.season = url_season;
        } else {
          this.season = this.currentSeason;
        }

        if (this.season < this.currentSeason) {
          this.updatePostseasonHeader(this.season);
          this.processPostseasonData(this.season);

        } else if (this.season == this.currentSeason) {
          this.updatePostseasonHeader(this.season);
          if (mode < 0) {
            throw "Invalid mode " + mode;
          } else if ((mode < 20) || (mode==21)) {
            // Waiting for postseason to start
            this.postseasonWaitingMessage()
          } else if (mode==31 && modeApiResult.elapsed<3600) {
            // Waiting for first day to finish
            this.postseasonWaitingMessage()
          } else {
            this.processPostseasonData(this.season);
          }

        } else {
          throw "Invalid season number requested: " + this.season;
        }

      })
      .catch(err => {
        console.log("Encountered error when calling /mode API endpoint");
        console.log(err);
        this.error(-1);
      });

    },

    postseasonWaitingMessage : function() {
      // Hide loading message
      this.loading(false);
      // Show waiting message
      var waitingElem = document.getElementById('container-postseason-waiting');
      waitingElem.classList.remove('invisible');
    },

    /**
     * Update the "Season X" header
     */
    updatePostseasonHeader : function(season0) {

      var seasonHeaderContainer = document.getElementById('season-header-container');

      // get element by id "landing-header-season" and change innerHTML to current season
      var seasonHead = document.getElementById('season-header-season-number');
      if (seasonHead != null) {
        var sp1 = parseInt(season0) + 1;
        seasonHead.innerHTML = sp1;
      }

      seasonHeaderContainer.classList.remove('invisible');

    },

    /**
     * Get postseason games data and do stuff with it.
     */
    processPostseasonData : function(season0) {

      // Get postseason
      let postseasonUrl = this.baseApiUrl + '/postseason/' + season0;
      fetch(postseasonUrl)
      .then(res => res.json())
      .then((postseasonApiResult) => {

        this.loading(false);

        // Show table of contents
        var tocId = 'postseason-toc-container';
        var tocElem = document.getElementById(tocId);
        tocElem.classList.remove('invisible');

        if (this.mode >= 40 || season0 < this.currentSeason) {
          this.fillChampionsContainer(season0);
        }

        for (var series in postseasonApiResult) {
          // If it is current season, some game series may be empty lists
          if (postseasonApiResult[series].length > 0) {
            // Get lowercase series name
            var lower = series.toLowerCase();
            this.addTocLink(lower);
            if (lower=='lds') {
              this.fillLdsSeriesContainer(postseasonApiResult[series]);
            } else if (lower=='lcs') {
              this.fillLcsSeriesContainer(postseasonApiResult[series]);
            } else if (lower=='hcs') {
              this.fillHcsSeriesContainer(postseasonApiResult[series]);
            }
          }
        } // end for each series

      })
      .catch(err => {
        console.log("Encountered error while calling /postseason endpoint");
        console.log(err);
        this.error(-1);
      });

    },

    /**
     * Fill the LDS game containers for each league.
     */
    fillLdsSeriesContainer : function(miniseason) {

      var container = document.getElementById('postseason-lds-container');

      if (this.leagues==null) {
        this.getLeagueNames(miniseason);
      }

      var nDivSeries = 2;
      var seriesNameId, seriesNameElem, seriesName, leagueName, seriesContainerElem;
      var iL;
      for (iL = 0; iL < this.leagues.length; iL++) {
        for (iS = 0; iS < nDivSeries; iS++) {

          seriesIdBase = 'lds-league-' + (iL+1) + '-series-' + (iS+1);
          seriesNameId = seriesIdBase + '-name';
          seriesNameElem = document.getElementById(seriesNameId);

          leagueName = this.leagues[iL];
          seriesName = leagueName + ' Division Series ' + (iS + 1);
          if (seriesNameElem != null) {
            seriesNameElem.innerHTML = seriesName;
          }

          seriesContainerId = seriesIdBase + '-container';
          seriesContainerElem = document.getElementById(seriesContainerId);

          if (seriesContainerElem != null) {
            this.populateLdsGames(miniseason, seriesContainerElem, iL, iS);
          }

        }
      }

      container.classList.remove('invisible');
    },

    /**
     * Populate an LDS series container with games.
     */
    populateLdsGames : function(miniseason, seriesContainerElem, iLeague, iSeries) {
      var league = this.leagues[iLeague];
      var seriesMatchText = "Series " + (iSeries + 1);

      var iDay;
      for (iDay = 0; iDay < miniseason.length; iDay++) {
        var miniday = miniseason[iDay];
        var iGame;
        for (iGame = 0; iGame < miniday.length; iGame++) {
          var minigame = miniday[iGame];
          if (minigame.league == league) {
            if (minigame.description.match(seriesMatchText)) {
              this.populateGamesHelper(minigame, seriesContainerElem);
            } // end if this game matches the series number
          } // end if this game matches the league
        } // end for each game
      } // end for each day
    },

    /**
     * Populate an LCS series container with games.
     */
    fillLcsSeriesContainer : function(miniseason) {

      var container = document.getElementById('postseason-lcs-container');

      if (this.leagues==null) {
        this.getLeagueNames(miniseason);
      }

      var seriesNameId, seriesNameElem, seriesName, leagueName, seriesContainerElem;
      for (iL = 0; iL < this.leagues.length; iL++) {

        seriesIdBase = 'lcs-league-' + (iL+1);
        seriesNameId = seriesIdBase + '-name';
        seriesNameElem = document.getElementById(seriesNameId);

        leagueName = this.leagues[iL];
        seriesName = leagueName + ' Championship Series';
        if (seriesNameElem != null) {
          seriesNameElem.innerHTML = seriesName;
        }

        seriesContainerId = seriesIdBase + '-container';
        seriesContainerElem = document.getElementById(seriesContainerId);

        if (seriesContainerElem != null) {
          this.populateLcsGames(miniseason, seriesContainerElem, iL);
        }

      }

      container.classList.remove('invisible');
    },

    /**
     * Populate an LCS series container with games.
     */
    populateLcsGames : function(miniseason, seriesContainerElem, iLeague) {

      var league = this.leagues[iLeague];

      var iDay;
      for (iDay = 0; iDay < miniseason.length; iDay++) {
        var miniday = miniseason[iDay];
        var iGame;
        for (iGame = 0; iGame < miniday.length; iGame++) {
          var minigame = miniday[iGame];
          if (minigame.league == league) {
            this.populateGamesHelper(minigame, seriesContainerElem);
          }
        } // end for each game
      } // end for each day
    },

    /**
     * Fill the HCS game container (only one)
     */
    fillHcsSeriesContainer : function(miniseason) {
      var container = document.getElementById('postseason-hcs-container');
      var leagueContainer = document.getElementById('hcs-league-container');
      this.populateHcsGames(miniseason, leagueContainer);
      container.classList.remove('invisible');
    },

    /**
     * Populate a HCS series container with games.
     */
    populateHcsGames : function(miniseason, seriesContainerElem) {
      var iDay;
      for (iDay = 0; iDay < miniseason.length; iDay++) {
        var miniday = miniseason[iDay];
        var iGame;
        for (iGame = 0; iGame < miniday.length; iGame++) {
          var minigame = miniday[iGame];
          this.populateGamesHelper(minigame, seriesContainerElem);
        } // end for each game
      } // end for each day
    },

    /**
     * Populate a champion title with the champion, if there is one.
     */
    fillChampionsContainer : function(season0) {

      var container = document.getElementById('postseason-champion-container');
      var championTeamElem = document.getElementById('champion-team');

      // Get champion
      let champUrl = this.baseApiUrl + '/champion/' + season0;
      fetch(champUrl)
      .then(res => res.json())
      .then((champApiResult) => {

        var winTeamname, winTeamColor, winTeamAbbr;

        if (!champApiResult.hasOwnProperty('teamName')) {
          throw "Error getting required key (teamName) from /champion API response";
        } else {
          winTeamName = champApiResult.teamName;
        }

        if (!champApiResult.hasOwnProperty('teamColor')) {
          throw "Error getting required key (teamColor) from /champion API response";
        } else {
          winTeamColor = champApiResult.teamColor;
        }

        if (!champApiResult.hasOwnProperty('teamAbbr')) {
          throw "Error getting required key (teamAbbr) from /champion API response";
        } else {
          winTeamAbbr = champApiResult.teamAbbr;
        }

        // Populate champion name/color
        if (winTeamName != null && winTeamColor != null) {
          championTeamElem.innerHTML = winTeamName;
          championTeamElem.style.color = winTeamColor;
          container.classList.remove('invisible');
        } else {
          throw "Error finding winning team name/color from /champion API response";
        }

        // Draw team icon
        if (winTeamAbbr != null) {

          var iconSize = "250";
          var iconId = "champion-icon";
          var icontainerId = "champion-icon-container";
          var icontainer = document.getElementById(icontainerId);
          var svg = document.createElement("object");

          svg.setAttribute('type', 'image/svg+xml');
          svg.setAttribute('data', '../img/' + winTeamAbbr.toLowerCase() + '.svg');
          svg.setAttribute('height', iconSize);
          svg.setAttribute('width', iconSize);
          svg.setAttribute('id', iconId);
          svg.classList.add('icon');
          svg.classList.add('team-icon');
          svg.classList.add('invisible');
          icontainer.appendChild(svg);

          // Wait a little bit for the data to load,
          // then modify the color and make it visible
          var paint = function(color, elemId) {
            var mysvg = $('#' + elemId).getSVG();
            var child = mysvg.find("g path:first-child()");
            if (child.length > 0) {
              child.attr('fill', color);
              $('#' + elemId).removeClass('invisible');
            }
          }
          // This fails pretty often, so try a few times.
          setTimeout(paint, 100,  winTeamColor, iconId);
          setTimeout(paint, 250,  winTeamColor, iconId);
          setTimeout(paint, 500,  winTeamColor, iconId);
          setTimeout(paint, 1000, winTeamColor, iconId);
          setTimeout(paint, 1500, winTeamColor, iconId);

        } else {
          throw "Error finding winning team abbr from /champion API response";
        }

      })
      .catch(err => {
        console.log("Encountered error while calling /champion API endpoint");
        console.log(err);
        this.error(-1);
      }); // end /champion api call

    },

    populateGamesHelper : function(minigame, seriesContainerElem) {

      // --------------
      // Create a new game:
      // Create a clone of the template
      var gametemplate = document.getElementById('finished-postgame-template');
      var cloneFragment = gametemplate.content.cloneNode(true);
      // Add the game id to the template game id
      if (minigame.hasOwnProperty('gameid')) {
        cloneFragment.querySelector(".card").setAttribute("id", minigame.gameid);
      }
      // Add the template game div to the page
      seriesContainerElem.appendChild(cloneFragment);

      // Populate this element
      var elem = document.getElementById(minigame.gameid);

      if (elem!=null) {

        // --------------
        // Team name labels:
        if (minigame.hasOwnProperty('team1Name') && minigame.hasOwnProperty('team2Name')) {
          var t1tags = elem.getElementsByClassName('team1name');
          var t2tags = elem.getElementsByClassName('team2name');
          var t;
          for (t = 0; t < t1tags.length; t++) {
            teamNameElem = t1tags[t];
            teamNameElem.innerHTML = minigame.team1Name;
          }
          for (t = 0; t < t2tags.length; t++) {
            teamNameElem = t2tags[t];
            teamNameElem.innerHTML = minigame.team2Name;
          }
        }

        // --------------
        // Team colors
        if (minigame.hasOwnProperty('team1Color') && minigame.hasOwnProperty('team2Color')) {
          var t1tags = elem.getElementsByClassName('team1color');
          var t2tags = elem.getElementsByClassName('team2color');
          var t;
          for (t = 0; t < t1tags.length; t++) {
            teamColorElem = t1tags[t];
            teamColorElem.style.color = minigame.team1Color;
          }
          for (t = 0; t < t2tags.length; t++) {
            teamColorElem = t2tags[t];
            teamColorElem.style.color = minigame.team2Color;
          }
        }

        // Game descriptions
        if (minigame.hasOwnProperty('description')) {
          var descElems = elem.getElementsByClassName('postseason-game-description');
          var iD;
          for (iD = 0; iD < descElems.length; iD++) {
            var descElem = descElems[iD];
            descElem.innerHTML = minigame.description;
          }
        }

        // Assemble series W-L records
        if (minigame.hasOwnProperty('team1SeriesWinLoss') && minigame.hasOwnProperty('team2SeriesWinLoss')) {
          var wlstr1 = "(" + minigame.team1SeriesWinLoss[0] + "-" + minigame.team1SeriesWinLoss[1] + ")";
          var wlstr2 = "(" + minigame.team2SeriesWinLoss[0] + "-" + minigame.team2SeriesWinLoss[1] + ")";
          var t1tags = elem.getElementsByClassName('team1seriesrecord');
          var t2tags = elem.getElementsByClassName('team2seriesrecord');
          var t;
          for (t = 0; t < t1tags.length; t++) {
            teamWinLossElem = t1tags[t];
            teamWinLossElem.innerHTML = wlstr1;
          }
          for (t = 0; t < t2tags.length; t++) {
            teamWinLossElem = t2tags[t];
            teamWinLossElem.innerHTML = wlstr2;
          }
        }

        // Update team scores
        if (minigame.hasOwnProperty('team1Score') && minigame.hasOwnProperty('team2Score')) {
          var t1s = minigame.team1Score;
          var t2s = minigame.team2Score;
          var iE;
          var t1ScoreElems = elem.getElementsByClassName('livecells1');
          for (iE = 0; iE < t1ScoreElems.length; iE++) {
            t1ScoreElems[iE].innerHTML = t1s;
          }
          var t2ScoreElems = elem.getElementsByClassName('livecells2');
          for (iE = 0; iE < t2ScoreElems.length; iE++) {
            t2ScoreElems[iE].innerHTML = t2s;
          }
        }

        // Update number of generations
        if (minigame.hasOwnProperty('generations')) {
          var genTags = elem.getElementsByClassName('generations-number');
          var gt;
          for (gt = 0; gt < genTags.length; gt++) {
            genNumberElem = genTags[gt];
            genNumberElem.innerHTML = minigame.generations;
          }
        }

        // Update map pattern name
        if (minigame.hasOwnProperty('mapName')) {
          var mapName = minigame.mapName;
          var mapTags = elem.getElementsByClassName('map-name');
          var mt;
          for (mt = 0; mt < mapTags.length; mt++) {
            mapNameElem = mapTags[mt];
            mapNameElem.innerHTML = mapName;
          }
        }

        // Update simulate game button link
        if (minigame.hasOwnProperty('gameid')) {
          var btnUrl = this.baseUIUrl + '/simulator/index.html?gameId=' + minigame.gameid;
          var btnTags = elem.getElementsByClassName('simulate');
          var bt;
          for (bt = 0; bt < btnTags.length; bt++) {
            btnNameElem = btnTags[bt];
            btnNameElem.setAttribute('href', btnUrl);
          }
        }
      } else {
        console.log('Could not find element for game ' + minigame.gameid);
      }
    },

    /**
     * For the given postseason series,
     * make the corresponding TOC link visible
     */
    addTocLink : function(lower) {
      var idLabel = lower + '-postseason-toc-text';
      var tocElem = document.getElementById(idLabel);
      if (tocElem==null) { 
        throw "Could not find table of contents element with id " + idLabel;
      }
      tocElem.setAttribute('href', '#' + lower);
    },

    /**
     * Get league names from the given postseason series miniseason.
     */
    getLeagueNames : function(miniseason) {
      var i, leaguesSet, day0;
      leaguesSet = new Set();
      day0 = miniseason[0];
      for (i = 0; i < day0.length; i++ ) {
        leaguesSet.add(day0[i].league);
      }
      var leagues = Array.from(leaguesSet);
      leagues.sort();
      this.leagues = leagues;
    },

    /***************************************************
     * Helper functions
     */
    helpers : {
      urlParameters : null, // Cache

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


      /**
       * Get URL Parameters
       */
      getUrlParameter : function(name) {
        if (this.urlParameters === null) { // Cache miss
          var hash, hashes, i;

          this.urlParameters = [];
          hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

          for (i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            this.urlParameters.push(hash[0]);
            this.urlParameters[hash[0]] = hash[1];
          }
        }

        return this.urlParameters[name];
      }

    },

  };

  PostseasonPage.helpers.registerEvent(window, 'load', function () {
    PostseasonPage.init();
  }, false);

}());