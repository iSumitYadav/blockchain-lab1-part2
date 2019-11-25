App = {
  web3Provider: null,
  contracts: {},
  voterScope: {},
  names: new Array(),
  url: 'http://127.0.0.1:7545',
  chairPerson:null,
  currentAccount:null,
  statesName: {
    0: "Init",
    1: "Register",
    2: "Vote",
    3: "Donate",
    4: "Done"
  },
  petitionScopeDict: {
    0: "Local",
    1: "National",
    2: "International"
  },
  currentPhase: 0,
  init: function() {
    $.getJSON('../proposals.json', function(data) {
      var proposalsRow = $('#proposalsRow');
      var proposalTemplate = $('#proposalTemplate');

      for (i = 0; i < data.length; i ++) {
        proposalTemplate.find('.panel-title').text(data[i].name + " : " + App.petitionScopeDict[data[i].scope]);
        proposalTemplate.find('.panel-link').attr('href', data[i].link);
        proposalTemplate.find('img').attr('src', data[i].picture);
        proposalTemplate.find('img').attr('title', data[i].tooltip);
        proposalTemplate.find('.btn-vote-for').attr('data-id', data[i].for_id);
        proposalTemplate.find('.btn-vote-for').attr('petitionScope', data[i].scope);
        proposalTemplate.find('.btn-vote-against').attr('data-id', data[i].against_id);
        proposalTemplate.find('.btn-vote-against').attr('petitionScope', data[i].scope);
        proposalTemplate.find('.btn-donate').attr('data-id', data[i].donate_id);
        proposalTemplate.find('.donate-amt').attr('data-id', data[i].donate_amt_id);
        proposalTemplate.find('.register-petition').attr('petitionNumber', data[i].petition_id);
        proposalTemplate.find('.register-petition').attr('id', "registerPetition" + data[i].petition_id);
        proposalTemplate.find('.register-petition').attr('petitionScope', data[i].scope);
        proposalTemplate.find('.petition-status').attr('petitionNumber', data[i].petition_id);
        proposalTemplate.find('.petition-status').attr('petitionScope', data[i].scope);
        proposalTemplate.find('.btn-req-donation-amt').attr('petitionNumber', data[i].petition_id);
        proposalTemplate.find('.btn-req-donation-amt').attr('petitionScope', data[i].scope);
        proposalTemplate.find('.for-count-span').attr('id', "forCountSpan" + data[i].petition_id);
        proposalTemplate.find('.against-count-span').attr('id', "againstCountSpan" + data[i].petition_id);


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
    $(document).on('click', '#register', function(){ var ad = $('#enterAddress').val(); App.handleRegister(ad); });
    $(document).on('click', '#changeStateBtn', function(){ var newState = $('#enterStateOpt').val(); App.handleChangeState(newState);});
    $(document).on('click', '.register-petition', App.handleRaisePetition);
    $(document).on('click', '.petition-status', App.handlePetitionStatus);
    $(document).on('click', '#currentStateBtn', App.handleCurrentState);
    $(document).on('click', '.btn-req-donation-amt', App.handleRequestDonationAmount);
  },

  populateAddress : function(){
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      jQuery.each(accounts,function(i){
        if(web3.eth.coinbase != accounts[i]){
          var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
          jQuery('#enterAddress').append(optionElement);  
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
      App.voterScope[App.chairPerson] = 2;

      if(App.chairPerson != App.currentAccount){
        jQuery('#addressDiv').css('display','none');
        jQuery('#registerDiv').css('display','none');
      }else{
        jQuery('#addressDiv').css('display','block');
        jQuery('#registerDiv').css('display','block');
      }
    });
  },

  handleRegister: function(addr){
    alert("Registering " + addr);
    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;

      var expert = parseInt($('#isExpert').val());
      var age = $('#ageId').val();
      var voter_scope = parseInt($('#voterScopeVal').val());

      return voteInstance.registerVoter(addr, expert, age, voter_scope);
    }).then(function(result){
      if(result){
        var voter_scope = $('#voterScopeVal').val();
        App.voterScope[addr] = parseInt(voter_scope);

        alert("Registration done successfully for " + addr);
      }
    }).catch(function(err){
      alert("Registration of " + addr + " not done successfully due to revert");
      // alert("Something Went Wrong. See Ganache logs. " + err['code']);
    });
},

  handleChangeState: function(newState){
    alert("Changing Phase to " + App.statesName[newState]);
    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;

      return voteInstance.changeState(newState);
    }).then(function(result){
      if(result){
        App.currentPhase = newState;
        alert("Phase changed successfully to " + App.statesName[newState]);
      } 
    }).catch(function(err){
      alert("Phase change to " + App.statesName[newState] + " unsuccessful due to revert");
      // alert("Something Went Wrong. See Ganache logs. " + err['code']);
    });
},

  handleCurrentState: function(event){
    event.preventDefault();
    var voteInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        return voteInstance.getCurrentState();
      }).then(function(result){
        if(result){
          App.currentPhase = result;
          alert("Current Phase: " + App.statesName[result]);
        }
      }).catch(function(err){
        alert("Current Phase fetching failed!");
        // alert("Something Went Wrong. See Ganache logs. " + err['code']);
      });
    });
  },

  handleVote: function(event) {
    event.preventDefault();

    var proposalId = parseInt($(event.target).data('id'));
    var petitionScope = parseInt($(event.target).attr('petitionScope'));
    var voteInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        return voteInstance.vote(proposalId, 0, {from: account});
      }).then(function(result){
        if(result){
          alert(account + " voting successful");
        }
      }).catch(function(err){
        alert(account + " voting unsuccessful due to revert");
        // alert("Something Went Wrong. See Ganache logs. " + err['code']);
      });
    });
  },

  handleVoteAgainst: function(event) {
    event.preventDefault();

    var proposalId = parseInt($(event.target).data('id'));
    var petitionScope = parseInt($(event.target).attr('petitionScope'));
    var voteInstance;
    proposalId = proposalId % 4;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        return voteInstance.vote(proposalId, 1, {from: account});
      }).then(function(result){
        if(result){
          alert(account + " vote against done successfully");
        }
      }).catch(function(err){
        alert(account + " vote against unsuccessful due to revert");
        // alert("Something Went Wrong. See Ganache logs. " + err['code']);
      });
    });
  },

  handleDonate: function(event) {
    event.preventDefault();

    var proposalId = parseInt($(event.target).data('id'));
    var amount = $(".donate-amt[data-id=" + (proposalId+4) +"]").val();
    var voteInstance;

    proposalId = proposalId % 4;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        return voteInstance.donate(proposalId, amount, {from: account});
      }).then(function(result){
        if(result){
          alert(account + " donation successful");
        }
      }).catch(function(err){
        if(App.currentPhase < 3){
          alert("Invalid Phase for this action");
        }else if(App.voterScope[account] === undefined && account !== App.chairPerson){
          alert("Not a Registered Voter");
        }else{
          alert(account + " donation unsuccessful due to revert");
        }
        // alert("Something Went Wrong. See Ganache logs. " + err['code']);
      });
    });
  },

  handleRaisePetition: function(event) {
    event.preventDefault();

    var petitionNumber = parseInt($(event.target).attr('petitionNumber'));
    var petitionScope = parseInt($(event.target).attr('petitionScope'));

    var voteInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;

        return voteInstance.raisePetition(petitionNumber, petitionScope, {from: account});

      }).then(function(result){
        if(result){
          alert(App.petitionScopeDict[petitionScope] + " Petition: " + petitionNumber + " raised successful");
          $("#registerPetition" + petitionNumber).attr("disabled","disabled");
        }
      }).catch(function(err){
        alert(App.petitionScopeDict[petitionScope] + " Petition: " + petitionNumber + " unsuccessful due to revert");
        // alert("Something Went Wrong. See Ganache logs. " + err['code']);
      });
    });
  },

  handlePetitionStatus : function(event) {
    event.preventDefault();

    var petitionNumber = parseInt($(event.target).attr('petitionNumber'));
    alert("Status of Petition: " + petitionNumber);
    var voteInstance;

    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      return voteInstance.reqPetitionStatus(petitionNumber);
    }).then(function(res){
      // alert("Petition: " + petitionNumber + " forCount: " + res[0].c[0] + " " + " againstCount: " + res[1].c[0]);
      $("#forCountSpan"+petitionNumber).text("For Count: " + res[0].c[0]);
      $("#againstCountSpan"+petitionNumber).text("Against Count: " + res[1].c[0]);
    }).catch(function(err){
      if(App.currentPhase < 4){
        alert("Invalid Phase for this action");
      }else{
        alert("Something Went Wrong. See Ganache logs. " + err['code']);
      }
    });
  },

  handleRequestDonationAmount : function(event) {
    event.preventDefault();

    var petitionNumber = parseInt($(event.target).attr('petitionNumber'));

    alert("Fetching Donation Amount of Petition: " + petitionNumber);

    var voteInstance;

    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      return voteInstance.reqDonationAmount(petitionNumber);
    }).then(function(res){
      alert("Donation Amount of Petition: " + petitionNumber + " is " + res.c[0]);
    }).catch(function(err){
      alert("Invalid Phase for this action");
      // alert("Something Went Wrong. See Ganache logs. " + err['code']);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
