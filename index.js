(function () {

  var LandingPage = {

    // http://localhost:8989/endpoint
    // ^^^^^^^^^^^^^^^^^^^^^
    //      baseApiUrl
    // http://localhost:8000/landing.html
    // ^^^^^^^^^^^^^^^^^^^^^
    //      baseUIUrl
    baseApiUrl : getBaseApiUrl(),
    baseUIUrl : getBaseUIUrl(),

    landingDivIds : [
      'container-loading',
      'container-mode0009',
      'container-mode1019',
      'container-mode21',
      'container-mode22',
      'container-mode23',
      'container-mode31',
      'container-mode32',
      'container-mode33',
      'container-mode40plus'
    ],

    init : function() {
      this.minilife();
    },

    /**
     * Add the minilife player to the appropriate <div> element
     */
    minilife : function() {
      var minilife = document.getElementById('minilife-player');
      var template = document.getElementById('minilife-template');
      var clone = template.content.cloneNode(true);
      minilife.appendChild(clone);

      var bod = document.getElementsByTagName('body')[0];
      var jsfiles = ['json-sans-eval.js', 'minilife.js'];
      for (let j in jsfiles) {
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', this.baseUIUrl + '/theme/js/' + jsfiles[j]);
        bod.append(script);
        if (j==1) {
          script.onload = () => {
            MiniGOL.init();
          }
        }
      }
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

  LandingPage.registerEvent(window, 'load', function () {
    LandingPage.init();
  }, false);

}());