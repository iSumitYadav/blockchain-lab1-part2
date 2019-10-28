pragma solidity ^0.5.2;
 
contract Change_Org {
    enum voteType {For, Against}
    enum scope {Local, National, International}
    
    struct Voter {
        uint weight;
        uint voteCount;
        uint petitionCount;
        uint age;
        bool expert; // bool expert if the voter is the domain expert
        scope voterScope;
        bool voted;
        bool registered;
    }
    
    struct Petition {
        uint256 forCount;
        uint256 againstCount;
        uint donation;
        uint petitionNumber;
        scope petitionScope;
        mapping(address => Voter) petitionVotes;
    }
    
    Petition[] petitions;
    
    address chairperson;
    mapping(address => Voter) voterList;
    
    enum Phase{Init, Regs, Vote, Donate, Done}
    
    Phase public state = Phase.Init;

    modifier validPhase(Phase reqPhase) { 
        require(state == reqPhase, 'validPhase');
        _;    
    }

    modifier onlyChair() {
        require(msg.sender == chairperson, 'onlyChair');
        _;
    }
    
    modifier validAge() {
        require(voterList[msg.sender].age > 18, 'validAge');
        _;
    }
    
    modifier validScope(uint petitionNumber) {
        require(voterList[msg.sender].voterScope >= petitions[petitionNumber].petitionScope, 'validScope');
        _;
    }
    
    modifier validPetitionCount() {
        require(voterList[msg.sender].petitionCount > 0, 'validPetitionCount');
        _;
    }
    
    modifier registeredVoter() {
        require(voterList[msg.sender].registered == true, 'registeredVoter');
        _;
    }
    
    constructor (uint maxNumPetitions) public {
        chairperson = msg.sender;
        voterList[chairperson].weight = 2; //weight 2 for chairperson
        voterList[chairperson].voteCount = 5;
        voterList[chairperson].petitionCount = 100;
        voterList[chairperson].age = 35;
        voterList[chairperson].voterScope = scope.International;
        voterList[chairperson].registered = true;
        petitions.length = maxNumPetitions;
    }

    function changeState(Phase x) onlyChair public {
        require (x > state, 'changeState');
        state = x;
    }
    
    //The chairperson or any registered voter with a valid petition count can raise a petition in a Registration phase
    function raisePetition(uint petitionNumber, scope petitionScope) public validPhase(Phase.Regs) registeredVoter() validPetitionCount()  {
        require(petitionNumber > 0, 'petitionNumber > 0'); // valid petition number
        require(petitionScope <= scope.International, 'petitionScope <= scope.International'); // valid petition type
        
        voterList[msg.sender].petitionCount = voterList[msg.sender].petitionCount - 1;
        petitions[petitionNumber].petitionScope = petitionScope;

        petitions[petitionNumber].forCount = petitions[petitionNumber].againstCount = petitions[petitionNumber].donation = 0;
    }
    
    //Function to register a voter, Only chair can register a voter with his age, scope and expert flag
    function registerVoter(address voter, bool expert, uint age, scope voterScope) public validPhase(Phase.Regs) onlyChair {
        voterList[voter].registered = true;
        voterList[voter].age = age;
        voterList[voter].voterScope = voterScope;
        if (true == expert)
            voterList[voter].weight = 3; // weight = 3 for the domain expert
        else
            voterList[voter].weight = 1;

        voterList[voter].voteCount = 5;
        voterList[voter].petitionCount = 3;
    }

    // Function to vote for a particular petition 
    function vote(uint petitionNumber, voteType voteType_) public validPhase(Phase.Vote) validScope(petitionNumber) validAge() {
        require(petitions[petitionNumber].petitionVotes[msg.sender].voted == false, '109'); // meaning the voter shouldn't have voted for the same proposal before 
        require (voterList[msg.sender].voteCount > 0, '110');
        require (petitionNumber < petitions.length, 'require');
        //require(voterList[msg.sender].voterScope >= petitions[petitionNumber].petitionScope);
        
        voterList[msg.sender].voteCount = voterList[msg.sender].voteCount - 1;
        if(voteType_ == voteType.For) {
            petitions[petitionNumber].forCount += voterList[msg.sender].weight;
        } else { // _type == voteType.Against
            petitions[petitionNumber].againstCount += voterList[msg.sender].weight;
        }
        petitions[petitionNumber].petitionVotes[msg.sender].voted = true;
    }
 
    // Function to donate for a particular petition, after voting   
    function donate(uint petitionNumber, uint amount) public validPhase(Phase.Donate) registeredVoter() {
        assert(amount > 0 && amount % 10 == 0); // donation amount should be greater than 0 and in multiple of $10 
        petitions[petitionNumber].donation += amount;  
    }
  
    // Function to get the final status of a particular petition after the voting phase is done.
    function reqPetitionStatus() public view returns (uint256 forCount, uint256 againstCount, uint256 abcd) {
        forCount = 1;
        againstCount = 2;
        abcd = 3;
        //forCount = petitions[petitionNumber].forCount;
        //againstCount = petitions[petitionNumber].againstCount;
        //if(forCount > againstCount)
        //    assert(forCount - againstCount > 1); // case where we have a tie
        //else
        //   assert(againstCount - forCount > 1); // case where we have a tie
    }
    
    // Function to get the total donation amount for a particular petition after the donation phase is done.
    function reqDonationAmount(uint petitionNumber) public validPhase(Phase.Done) view returns (uint256 usd) {
        usd = petitions[petitionNumber].donation;
    }
}