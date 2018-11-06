$(function() {
  let $start = $("#start");
  let $stop = $("#stop");

  initInput();
  initEvent();
  initButton();

  function disabled($btn) {
    $btn.attr("disabled", true);
  }
  function enabled($btn) {
    $btn.attr("disabled", false);
  }

  function initInput() {
    // $('[data-config="date"]').val(dateFns.format(new Date(), "YYYY-MM-DD"));
    let today = new Date();

    initInputConfig();

    chrome.storage.sync.get(["config"], ({ config }) => {
      // config.date
      if (!config.date || dateFns.isPast(new Date(config.date))) {
        $('[data-config="date"]').val(dateFns.format(new Date(), "YYYY-MM-DD"));
      }
    });
  }

  function initButton() {
    chrome.storage.sync.get(["config", "launch"], ({ config, launch }) => {
      if (launch > 0) {
        disabled($start);
        enabled($stop);
      } else {
        enabled($start);
        disabled($stop);
      }
    });
  }

  function initEvent() {
    $start.click(function() {
      disabled($start);
      enabled($stop);
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        let config = getConfig();
        // chrome.tabs.sendMessage(tabs[0].id, { config, launch: 2 });

        chrome.storage.sync.set({ config, launch: 2 });
      });
    });

    $stop.click(function() {
      enabled($start);
      disabled($stop);
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.storage.sync.set({ launch: -1 });
        // chrome.tabs.sendMessage(tabs[0].id, {
        //   launch: -1
        // });
      });
    });
  }

  function getConfig() {
    return $("[data-config]")
      .toArray()
      .reduce((config, item) => {
        let key = $(item).attr("data-config");
        config[key] = $(item).val();
        return config;
      }, {});
  }

  function initInputConfig() {
    chrome.storage.sync.get(["config"], ({ config }) => {
      for (let key in config) {
        $(`[data-config="${key}"]`).val(config[key]);
      }
    });
  }
});
