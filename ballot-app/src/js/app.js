App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'http://127.0.0.1:7545',
  chairPerson:null,
  currentAccount:null,
  init: function() {
    $.getJSON('../proposals.json', function(data) {
      var proposalsRow = $('#proposalsRow');
      var proposalTemplate = $('#proposalTemplate');

      for (i = 0; i < data.length; i ++) {
        proposalTemplate.find('.panel-title').text(data[i].name);
        proposalTemplate.find('img').attr('src', data[i].picture);
        proposalTemplate.find('.btn-vote').attr('data-id', data[i].id);

        proposalsRow.append(proposalTemplate.html());
        App.names.push(data[i].name);
      }
    });
    return App.initWeb3();
  },

  initWeb3: function() {
        // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);

    ethereum.enable();

    App.populateAddress();
    return App.initContract();
  },

  initContract: function() {
      $.getJSON('Change_Org.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var voteArtifact = data;
    App.contracts.vote = TruffleContract(voteArtifact);

    // Set the provider for our contract
    App.contracts.vote.setProvider(App.web3Provider);
    
    App.getChairperson();
    return App.bindEvents();
  });
  },

  bindEvents: function() {
    $(document).on('click', '.btn-vote-for', App.handleVote);
    $(document).on('click', '#win-count', App.handleWinner);
    $(document).on('click', '#register', function(){ var ad = $('#enter_address').val(); App.handleRegister(ad); });
    $(document).on('click', '#change_state_btn', function(){ var newState = $('#enter_state_opt').val(); App.handleChangeState(newState);});
  },

  populateAddress : function(){
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      jQuery.each(accounts,function(i){
        if(web3.eth.coinbase != accounts[i]){
          var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
          jQuery('#enter_address').append(optionElement);  
        }
      });
    });
  },

  getChairperson : function(){
    App.contracts.vote.deployed().then(function(instance) {
      return instance;
    }).then(function(result) {
      App.chairPerson = result.constructor.currentProvider.selectedAddress.toString();
      App.currentAccount = web3.eth.coinbase;
      if(App.chairPerson != App.currentAccount){
        jQuery('#address_div').css('display','none');
        jQuery('#register_div').css('display','none');
      }else{
        jQuery('#address_div').css('display','block');
        jQuery('#register_div').css('display','block');
      }
    })
  },

  handleRegister: function(addr){
    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      // return voteInstance.register(addr);
      return voteInstance.registerVoter(addr, 0, 30, 0);
    }).then(function(result, err){
        if(result){
            if(parseInt(result.receipt.status) == 1)
            alert(addr + " registration done successfully")
            else
            alert(addr + " registration not done successfully due to revert")
        } else {
            alert(addr + " registration failed")
        }   
    });
},

  handleChangeState: function(newState){
    alert(newState);
    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      return voteInstance.changeState(newState);
    }).then(function(result, err){
        if(result){
            // if(parseInt(result.receipt.status) == 1)
            alert(newState + " registration done successfully")
            console.log(result + " registration done successfully")
            // if(newState == 2){
            //   $("#register").prop( "disabled", true);
            // }
            // else
            // alert(addr + " registration not done successfully due to revert")
        } else {
            alert(newState + " registration failed")
            alert(err + " registration failed")
        }   
    });
},

  handleVote: function(event) {
    event.preventDefault();
    var proposalId = parseInt($(event.target).data('id'));
    var voteInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];
      alert(account + " voting failed")
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        // return voteInstance.vote(proposalId, {from: account});
        return voteInstance.vote(0, 0);
        // return voteInstance.changeState(4);
        // return voteInstance.registerVoter(account, 0, 30, 0);
      }).then(function(result, err){
            if(result){
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " voting done successfully")
                else
                alert(account + " voting not done successfully due to revert")
            } else {
                alert(account + " voting failed")
            }
        });
    });
  },

  handleWinner : function() {
    console.log("To get winner");
    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      return voteInstance.reqPetitionStatus();
    }).then(function(res){
    console.log(res);
    console.log(res[2].c[0]);
      alert(App.names[res] + "  is the winner ! :)");
    }).catch(function(err){
      console.log(err.message);
    })
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
