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
        proposalTemplate.find('.panel-link').attr('href', data[i].link);
        proposalTemplate.find('img').attr('src', data[i].picture);
        proposalTemplate.find('img').attr('title', data[i].tooltip);
        proposalTemplate.find('.btn-vote-for').attr('data-id', data[i].for_id);
        proposalTemplate.find('.btn-vote-against').attr('data-id', data[i].against_id);
        proposalTemplate.find('.btn-donate').attr('data-id', data[i].donate_id);
        proposalTemplate.find('.donate-amt').attr('data-id', data[i].donate_amt_id);

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
    $(document).on('click', '.btn-vote-against', App.handleVoteAgainst);
    $(document).on('click', '.btn-donate', App.handleDonate);
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
    alert(addr);
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
            alert("state changed")
            console.log("state change successfull")
            // if(newState == 2){
            //   $("#register").prop( "disabled", true);
            // }
            // else
            // alert(addr + " registration not done successfully due to revert")
        } else {
            // alert(newState + " registration failed")
            alert("state change unsuccessfull")
            // alert(err + " registration failed")
        }   
    });
},

  handleVote: function(event) {
    event.preventDefault();
    var addr = $('#enter_address').val();
    // alert(addr);
    var proposalId = parseInt($(event.target).data('id'));
    // alert(proposalId);
    var voteInstance;

    web3.eth.getAccounts(function(error, accounts) {
      // var account = accounts[0];
      var account = addr;
      // alert(account + " voting failed")
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        // return voteInstance.vote(proposalId, {from: account});
        return voteInstance.vote(proposalId, 0);
        // return voteInstance.changeState(4);
        // return voteInstance.registerVoter(account, 0, 30, 0);
      }).then(function(result, err){
            if(result){
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " voting successfull")
                else
                alert(account + " voting unsuccessfull due to revert")
            } else {
                alert(account + " voting failed")
            }
        });
    });
  },

  handleVoteAgainst: function(event) {
    event.preventDefault();
    var addr = $('#enter_address').val();
    // alert(addr);
    var proposalId = parseInt($(event.target).data('id'));
    // alert(proposalId);
    var voteInstance;
    proposalId = proposalId % 4;
    web3.eth.getAccounts(function(error, accounts) {
      // var account = accounts[0];
      var account = addr;
      // alert(account + " voting failed")
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        // return voteInstance.vote(proposalId, {from: account});
        return voteInstance.vote(proposalId, 1);
        // return voteInstance.changeState(4);
        // return voteInstance.registerVoter(account, 0, 30, 0);
      }).then(function(result, err){
            if(result){
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " vote against done successfully")
                else
                alert(account + " vote against unsuccessfull due to revert")
            } else {
                alert(account + " vote against failed")
            }
        });
    });
  },

  handleDonate: function(event) {
    event.preventDefault();
    var addr = $('#enter_address').val();
    // alert(addr);
    var proposalId = parseInt($(event.target).data('id'));
    // alert(proposalId);
    var amount = $(".donate-amt[data-id=" + (proposalId+4) +"]").val();
    // console.log(amount);
    var voteInstance;
    proposalId = proposalId % 4;
    web3.eth.getAccounts(function(error, accounts) {

      var account = addr;
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        // return voteInstance.vote(proposalId, {from: account});
        return voteInstance.donate(proposalId, amount);
        // return voteInstance.changeState(4);
        // return voteInstance.registerVoter(account, 0, 30, 0);
      }).then(function(result, err){
            if(result){
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " donation successfull")
                else
                alert(account + " donation unsuccessfull due to revert")
            } else {
                alert(account + " donation failed")
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
