

/////////////////////////////////////////////////////////////////// GLIDERECORD SCRIPTS /////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////====================== RECORD QUERIES ===========================////////////////////////////////////////////////////////

// example
var target = new GlideRecord('incident'); 
target.addQuery('priority',1);
target.query(); // Issue the query to the database to get relevant records 
while (target.next()) { 
  // add code here to process the incident record 
}


///---------------------- GET FIELD VALUE --------------------------///

// For regular forms, use this:
var disp = g_form.getDisplayBox("field_name").value;
// In the Service Catalog, you may have to use this instead:
var varDisp = g_form.getDisplayBox(g_form.resolveNameMap("variable_name")).value;


///---------------------- DISTINCT OPERATING SYSTEMS OF CI's --------------------------///

distinctOS();
function distinctOS() {
        var gaServer = new GlideAggregate('cmdb_ci_server'); //GlideAggregate query
        gaServer.addAggregate('count'); //Count aggregate (only necessary for a count of items of each OS)
        gaServer.orderByAggregate('count'); //Count aggregate ordering
        gaServer.groupBy('os'); //Group aggregate by the 'os' field
        gaServer.query();
        while(gaServer.next()){
                var osCount = gaServer.getAggregate('count'); //Get the count of the OS group
                //Print the OS name and count of items with that OS
                gs.print('Distinct operating system: ' + gaServer.os + ': ' + osCount);
        }
}


///---------------------- ACTIVE REQUESTS WITHOUT REQUESTED ITEMS --------------------///

activeRequestWithoutRITM();
function activeRequestWithoutRITM() {
        var grRequest = new GlideRecord("sc_request");
        grRequest.addEncodedQuery("active=true");
        grRequest.query();
        gs.print('Active Requests without Requested Items :(');
        while (grRequest.next()) {
                var gaRequestedItem = new GlideAggregate("sc_req_item");
                gaRequestedItem.addQuery("request",grRequest.sys_id);
                gaRequestedItem.addAggregate('COUNT');
                gaRequestedItem.query();
                var req = 0;
                if (gaRequestedItem.next()) {
                req = gaRequestedItem.getAggregate('COUNT');
                if (req == 0) 
                gs.print(grRequest.number + " | " + grRequest.opened_by.name + " | " + grRequest.opened_at);
                }
        }
}


///---------------------- GET ALL CIs WITHIN ALL CLASSES ---------------------------------///

getAllClasses();

function getAllClasses() {
var count = new GlideAggregate('cmdb_ci');
count.addAggregate('COUNT', 'sys_class_name');
count.query();
while (count.next()) {
                var ciClass = count.sys_class_name;
                var classCount = count.getAggregate('COUNT', 'sys_class_name');
                        if (classCount <= 1) {
                                gs.log("The is currently " + classCount + " CI with a class of " + ciClass);
                        }
                        if (classCount > 1) {
                                gs.log("The are currently " + classCount + " CIs with a class of " + ciClass);
                        }
                
                }
}



////////////////////////////////////////////////====================== RECORD UPDATES ===========================////////////////////////////////////////////////////////


///---------------------- REQUEST Ansible Access Roles  ---------------------------///

var grUM2ARS = new GlideRecord('access_roles_servers');
grUM2ARS.addEncodedQuery("u_state=Failed^u_server.install_status=1^u_server.u_infrastructure=false");
grUM2ARS.query();
//gs.print('CTasks count = '+ grUM2ARS.getRowCount());
while (grUM2ARS.next()) {
   gs.print(grUM2ARS.u_server + ' Change State before = '+ grUM2ARS.u_state );
   grUM2ARS.u_state = 'Requested';       
   gs.print(grUM2ARS.u_server + ' Change State after = '+ grUM2ARS.u_state );  
   grUM2ARS.update();
}

///---------------------- CANCEL CASES  ---------------------------///

cancelCases();
function cancelCases(){
	var gr = new GlideRecord('sn_customerservice_case');
	    gr.addEncodedQuery('sys_created_byLIKEadmindcv^state=1');
	    gr.orderBy('order');
	    gr.query();
	    gs.log('Cases count are: ' +  gr.getRowCount() + '\n');
	    while(gr.next()) {
		var date = new GlideDateTime();
		var newdate = date.getDisplayValue();
		gs.log(gr.number);   
		gs.log('new date is: ' +  newdate + '\n');        
		gr.state = '7';
		// gr.work_end = newdate;
		gr.update();
	}
}


///---------------------- Bulk amendment of a specific SLA Definition ---------------------------///

// REQUIREMENTS
// 1) Start condition: ADD 'Incident state is not Cancelled';  'Not Customer visible ticket is false', 'Reason Code is not one of: Time Registration, Ticket created by mistake,  Ticket created to test, Ticket is a duplicate'
// Other conditions that are already in Start Conditions should not be changed/overwritten (e.g. Priority). Some of SLA Definitions may already have some of the above, e.g. "Incident state is not Cancelled'
// 2) Stop condition: CHANGE to 'Incident state is one of: Resolved, Closed' ('Cancelled' should be removed from this condition). Some definitions may have it setup properly already.
// 3) Reset Condition: ADD "Contract.Availability report on is: Business Service AND Business Service changes OR All of these conditions must be met Contract.Availability report on is Configuration Item AND Confoiguration Item changes"
// Some definitions may have it setup properly already.

// CODE
updateCI();
function updateCI(){
var name = 'FPI Test Down Time 2';
    var csla = new GlideRecord('contract_sla');
    csla.addQuery('name','=', name);
    // csla.addQuery('sys_id', '35420982d732220035ae23c7ce610393');
    csla.query();
    gs.print('grCI Query: ' +  csla.getEncodedQuery() + ' = ' +   csla.getRowCount());

    while (csla.next()) {
        // start condition
        if (csla.start_condition.includes("incident_state!=8")) { 
	// CREATING Not Customer visible ticket is false CONDITION
            csla.start_condition = csla.start_condition + '^u_internal=false';
	    // CREATING Reason Code is not one of: Time Registration, Ticket created by mistake, Ticket created to test, Ticket is a duplicate CONDITION
	    // CODE LINE NOT WORKING
            csla.start_condition = csla.start_condition + '^u_reason_codeNOTINTime Registration,Ticket created by mistake,Ticket created to test,Ticket is a duplicate';
        } else { // create above conditions + Incident state is not Cancelled CONDITION
            // csla.start_condition = csla.start_condition + '^incident_state!=8';
            csla.start_condition = csla.start_condition + '^u_internal=false';
	    // CODE LINE NOT WORKING
            csla.start_condition = csla.start_condition + '^u_reason_codeNOTINTime Registration,Ticket created by mistake,Ticket created to test,Ticket is a duplicate';
        }

        // stop condition
        var str = 'IN6,7,8';
        if (csla.stop_condition.incident_state == str) {
            csla.stop_condition = csla.stop_condition + '^incident_stateIN6,7'; // create new condition
        } else {
	    // if (csla.stop_condition.incident_state == 'IN10') {
	    // csla.stop_condition = csla.stop_condition.replace('IN10','IN6,7'); // updating existing condition
	    // }
            csla.stop_condition = csla.stop_condition.replace('IN6,7,8','IN6,7'); // updating existing condition
        } 

        csla.update();

    }
}


///---------------------- CANCEL RITM / SRQ ---------------------------///

var ReqItem = new GlideRecord('sc_req_item');
    ReqItem.addQuery('sys_id', 'xxx'); // paste correct sys_id
    ReqItem.query();
    ReqItem.setWorkflow(false); // it will bypass BRs CS etc.
    if(ReqItem.next()) {
        ReqItem.close_notes = 'reason...';
        ReqItem.state = '9'; //8 Closed Cancelled / 9 Closed Incomplete
        ReqItem.update();
    }

///----- CANCEL BULK of RITMs along with the associated Catalog Tasks and Change Requests and their related Change Tasks ------///

// I. query the Time
// var time = new GlideDateTime();
// var currentTime = time.getDisplayValue();
// gs.print('new date is: ' + currentTime);

var encQuery  = "active=true^numberLIKERITM0105056";// encoded query should be placed here
// II. query the Request Items
    var ReqItem = new GlideRecord('sc_req_item');
        ReqItem.addEncodedQuery(encQuery);
        ReqItem.query();
        ReqItem.setWorkflow(false); // it will bypass BRs CS etc.
        // ReqItem.autoSysFields(false); // will prevent your name from appearing that you perform this acction
        gs.print('Request Items count = '+ ReqItem.getRowCount()); // check if the items numbers match with the SN table query 

// III. loop through Request Items
        while (ReqItem.next()) {
            var ReqItemNum = ReqItem.getValue('number');
            gs.print( ReqItemNum +' '+ ReqItem.number + ' ReqItem State before change = '+ ReqItem.state + ' New comment = ' + ReqItem.comments);

// III.1 query the Cataog tasks associated to Request Items
                var catTask = new GlideRecord('sc_task');
                    catTask.addQuery('request_item.number', ReqItemNum);
                    catTask.addEncodedQuery('stateIN-5,1,2,112');// query records only with states -5,1,2,112
                    catTask.query();
                    catTask.setWorkflow(false); // it will bypass BRs CS etc.
                    // catTask.autoSysFields(false); // will prevent your name from appearing that you perform this acction
                    gs.print(' catTask count = '+ catTask.getRowCount()); // check if the items numbers match with the SN table query  

//III.1.2 make the amendment on the SCTASKs                    
                       while (catTask.next()) {                                          
                            gs.print(catTask.number + ' catTask State before change = '+ catTask.state + ' New comment = ' + catTask.comments);
                            catTask.state = 8; // '8' for  Closed Cancelled
                            // catTask.comments ='"Old request resolved in 2020, reopened due to issue in ServiceNow. Agreed to close and exclude." - RITM0102819';
                            gs.print(catTask.number + ' catTask State after change = '+ catTask.state + ' New comment = ' + catTask.comments);
                            catTask.update();
                       }

// III.2 query the Change Request associated to Request Items

//III.2.1 query the Change Request 
                    var chgReq = new GlideRecord('change_request');
                        chgReq.addQuery('u_qs_requested_item.number', ReqItemNum);
                        chgReq.orderBy('order');
                        chgReq.query();
                        chgReq.setWorkflow(false); // it will bypass BRs CS etc.
                        // chgReq.autoSysFields(false); // will prevent your name from appearing that you perform this acction
                        gs.print('chgReq count = '+ chgReq.getRowCount()); 
                            while (chgReq.next()) {
                                var chgReqNum = chgReq.getValue('number');
                                gs.print( chgReq.number + ' chgReq State before change = '+ chgReq.state + ' New comment = ' + chgReq.comments);
                                
//III.2.1 query the Change task  associated to change Request 
                                    var chgTask = new GlideRecord('change_task');
                                        chgTask.addQuery('change_request.number',chgReqNum);
                                        chgTask.addEncodedQuery('stateIN-5,1,2'); // query records only with states -5,1,2
                                        chgTask.query();
                                        // chgTask.autoSysFields(false); // will prevent your name from appearing that you perform this acction
                                        var chgTaskNum = chgTask.getElement('number');
                                        gs.print('chgTask count = '+ chgTask.getRowCount());

//III.2.2 make the amendment on the CTASKs                                       
                                            while (chgTask.next()) {
                                                chgTask.setWorkflow(false); // it will bypass BRs CS etc.
                                                gs.print(chgTaskNum + ' Ctask State before change = ' + chgTask.state);
                                                var date = new GlideDateTime();
                                                var newdate = date.getDisplayValue();
                                                gs.log(chgTaskNum + '\n');
                                                gs.log('new date is: ' + newdate);
                                                chgTask.state = '4'; // 3 - closed , 4 - cancelled
                                                chgTask.work_end = newdate;
                                                chgTask.update();
                                                gs.print(chgTaskNum + ' Ctask State after change = ' + chgTask.state);
                                            }
//III.2.3 make the amendment   on the change request items
                                chgReq.setWorkflow(false);
                                chgReq.state = 308; // '308' for Cancel
                                // chgReq.comments = '"Old request resolved in 2020, reopened due to issue in ServiceNow. Agreed to close and exclude." - RITM0102819';
                                chgReq.u_qs_closure_code = 3; // closure code set to cancelled
                                // gs.print( chgReq.number + ' chgReq State after change = '+ chgReq.state + ' New comment = ' + chgReq.comments);
                                chgReq.update();
                                gs.print(chgReqNum + ' Change State after = '+ chgReq.state);
                            }
//IV.2.2 make the amendment   on the request items   
            // ReqItem.comments = '"Old request resolved in 2020, reopened due to issue in ServiceNow. Agreed to close and exclude." - RITM0102819';
            ReqItem.state = '9'; //8 Closed Cancelled / 9 Closed Incomplete
            gs.print(ReqItem.number + ' ReqItem State after change = '+ ReqItem.state + ' New comment = ' + ReqItem.comments);
            ReqItem.update();                     
             
}


///------ CANCEL bulk of Change Request along with their related Change Tasks -----///

// 1st method

var encQuery  = "INCHG0035377,CHG0045215,CHG0045272"; // encoded query should be placed here  

var chgReq = new GlideRecord('change_request');  
chgReq.addEncodedQuery(encQuery);  
// chgReq.addQuery('sys_id', 'd84a163cb875911064d5a92a5dc149d5');
chgReq.orderBy('order'); 
chgReq.query();  
gs.print('Change Request count = '+ chgReq.getRowCount());  
    while (chgReq.next()) {  
        var chgReqNum = chgReq.getValue('number') ;  
        gs.print(chgReqNum + ' Change State before = '+ chgReq.state);  
        var chgTask = new GlideRecord('change_task');  
        chgTask.addQuery('change_request.number',chgReqNum);  
        chgTask.addEncodedQuery('stateIN-5,1,2'); // query records only with states -5,1,2  
        chgTask.orderBy('order');  
        chgTask.query();  
        gs.print('CTasks count = '+ chgTask.getRowCount());  
        while (chgTask.next()) {  
            // chgTask.setWorkflow(false);  
            gs.print(chgTask.number + ' Ctask State before change = ' + chgTask.state);  
            chgTask.state = '4'; // 3 - closed , 4 - cancelled  
            chgTask.update();  
            gs.print(chgTask.number + ' Ctask State after change = ' + chgTask.state);  
        } 
    // chgReq.state = '308'; // 308 cancelled  
    // chgReq.update(); 
    gs.print(chgReqNum + ' Change State after = '+ chgReq.state);
}  

// 2nd method 

var encQuery  = "numberINCHG0124328"; // encoded query should be placed here  
 

var chgReq = new GlideRecord('change_request');  
chgReq.addEncodedQuery(encQuery);  
chgReq.orderBy('order');  
chgReq.query();  
chgReq.setWorkflow(false); // allows you to make a comment 
gs.print('Change Request count = '+ chgReq.getRowCount());  
    while (chgReq.next()) {  
        var chgReqNum = chgReq.getValue('number') ;  
        gs.print(chgReqNum + ' Change State before = '+ chgReq.state);
        var chgTask = new GlideRecord('change_task');
                chgTask.addQuery('change_request.number',chgReqNum);
                chgTask.addEncodedQuery('stateIN-5,1,2'); // query records only with states -5,1,2
                chgTask.orderBy('order');
                chgTask.query();
                gs.print('CTasks count = '+ chgTask.getRowCount());
                while (chgTask.next()) {  
                    // chgTask.setWorkflow(false);
                    gs.print(chgTask.number + ' Ctask State before change = ' + chgTask.state);
                    chgTask.state = '4'; // 3 - closed , 4 - cancelled
                    // chgTask.update();
                    gs.print(chgTask.number + ' Ctask State after change = ' + chgTask.state);
                }
        gs.print(chgReqNum + ' Change State after = '+ chgReq.state);
    }  


///---------------------- CANCEL/CLOSE INCIDENT ---------------------------///

var gr = new GlideRecord('incident');
    gr.addQuery('sys_id', 'b7e838f8bc43811064d59d2a941d0439'); // paste correct sys_id
    gr.query();
    if(gr.next()) {
        gr.close_code = 'Closed/Resolved by Caller';
        gr.close_notes = 'Issue has been resolved';
        gr.state = '7'; //7 Closed 113 Cancelled
        gr.update();
    }


///---------------------- CANCEL/CLOSE CHANGE REQUEST ---------------------------///
 
closeCHANGE();
function closeCHANGE(){
    var gr = new GlideRecord('change_request');
    gr.addQuery('sys_id', '8c4fe890c7cd811464d5f293ef22793e'); // paste correct sys_id
    gr.query();
    if(gr.next()) {
        gr.state = '307'; //307 CLOSED
        gr.update();
    }
}

cancelCHANGE();
function cancelCHANGE(){
    var gr = new GlideRecord('change_request');
    gr.addQuery('sys_id', '8c4fe890c7cd811464d5f293ef22793e'); // paste correct sys_id
    gr.query();
    if(gr.next()) {
        gr.state = '308'; //308 CANCELLED
        gr.update();
    }
}


///---------------------- RE-SSIGN CHANGE REQUEST TO A DIFFERENT ASSIGNMENT GROUP ---------------------------///

var gr = new GlideRecord('change_request');
gr.addQuery('sys_id', 'b05e5e47c7960d5064d56d04ef2279e9'); // Replace correct sys_id of the change you want to modify
gr.query();
if(gr.next()) {
    var assignment_group = "b8d93d97c7de770064d5f293ef2279f2";
    if (assignment_group) { // check on the specific assignment group
        gr.assignment_group = "9abcae9bc74824d464d5f293ef2279a8"; // re-assign the assignment group
        gr.setWorkflow(false); // Disables the running of BRs that might normally be triggered by subsequent actions
        gr.update();
    }
}


///---------------------- CLOSE/CANCEL CTASK ---------------------------///

closeCTASK();
function closeCTASK(){
    var gr = new GlideRecord('change_task');
    gr.addQuery('sys_id', '8c4fe890c7cd811464d5f293ef22793e'); // paste correct sys_id
    gr.query();
    if(gr.next()) {
        gr.state = '3';
	gr.setValue('description', 'task completed');
        gr.update();
    }
}

cancelCTASK();
function cancelCTASK(){
    var gr = new GlideRecord('change_task');
    gr.addQuery('sys_id', '8c4fe890c7cd811464d5f293ef22793e'); // paste correct sys_id
    gr.query();
    if(gr.next()) {
        gr.state = '4'; 
        gr.update();
    }
}

///---------------------- CREATE CHANGE TASKS FOR A SINGLE CHANGE REQUEST ---------------------------///

var gr = new GlideRecord('change_task');
// Create first change_task for each of the changes listed in the above array
gr.addQuery('change_request', '1c87925347c12200e0ef563dbb9a7177');
gr.query();
gr.order = 100;
gr.short_description = 'Notify Service Desk';
gr.assignment_group = 'Change Management';
gr.insert();

// Create 2nd change_task for each of the changes listed in the above array
var gr = new GlideRecord('change_task');
gr.addQuery('change_request', '1c87925347c12200e0ef563dbb9a7177');
gr.query();
gr.order = 200;
gr.short_description = 'Implement the change';
gr.assignment_group = 'Change Management';
gr.insert();

// Create 3nd change_task for each of the changes listed in the above array
var gr = new GlideRecord('change_task');
gr.addQuery('change_request', '1c87925347c12200e0ef563dbb9a7177');
gr.query();
gr.order = 300;
gr.short_description = 'Validate the change';
gr.assignment_group = 'Change Management';
gr.insert();


///---------------------- CREATE CHANGE TASKS FOR MULTIPLE CHANGE REQUESTS ---------------------------///

var change_arr = ['CHG0040005', 'CHG0040006']; //Iterate through the changes that need these new change tasks

for (var i=0; i < change_arr.length; i++){
	// Create first change_task for each of the changes listed in the above array
	var gr = new GlideRecord('change_task');
	gr.change_request = getSysid(change_arr[i]);
	gr.order = 100;
	gr.short_description = 'Notify Service Desk';
	gr.assignment_group = 'Change Management';
	gr.insert();
	
	// Create 2nd change_task for each of the changes listed in the above array
	var gr = new GlideRecord('change_task');
	gr.change_request = getSysid(change_arr[i]);
	gr.order = 200;
	gr.short_description = 'Implement the change';
	gr.assignment_group = 'Change Management';
	gr.insert();
	
	// Create 3nd change_task for each of the changes listed in the above array
	var gr = new GlideRecord('change_task');
	gr.change_request = getSysid(change_arr[i]);
	gr.order = 300;
	gr.short_description = 'Validate the change';
	gr.assignment_group = 'Change Management';
	gr.insert();
}

function getSysid(num){

	// get the sys_id for a change request item
	var chg = new GlideRecord('change_request');
	chg.addQuery('number', num);
	chg.query();

	if(chg.next()){
		return chg.sys_id;
	}
		return '';
}


///---------------------- CANCEL CTASKS FOR A SINGLE CHANGE REQUEST ---------------------------///

// ex. 1)
var grt = new GlideRecord('change_task');
grt.addQuery('change_request', 'eaf5d21347c12200e0ef563dbb9a7109');
grt.query();
while(grt.next()) {
	if (grt.state != 4) {
		grt.state = 4;
		grt.update();
	}
}

// ex. 2)
var gr = new GlideRecord('change_task');
   gr.addQuery('change_request', '1de0692d5fda011064d574a460069cbf'); //paste correct sysID
   gr.addEncodedQuery('stateIN-5,1,2');
   gr.orderBy('order');
   gr.query();
   gs.log('change task count is: ' + gr.getRowCount());
   while(gr.next()) {
       var date = new GlideDateTime();
       var newdate = date.getDisplayValue();
       gs.log(gr.number + '\n');
       gs.log('new date is: ' + newdate);
       gr.state = '4'; // 3 - closed , 4 - cancelled
       gr.work_end = newdate;
       gr.update();
}


///---------------------- CLOSE CHANGE TASKS FOR A SINGLE CHANGE REQUEST ---------------------------///

var gr = new GlideRecord('change_task');
	gr.addQuery('change_request', '3e3d586a5f4d74dc64d574a460069cab'); //paste correct sysID
        gr.addEncodedQuery('stateIN-5,1,2');
        gr.orderBy('order');
	gr.query();
        gs.log('change task count is: ' +  gr.getRowCount());
	while(gr.next()) {
		var date = new GlideDateTime();
		var newdate = date.getDisplayValue();
        	gs.log(gr.number + '\n');
                gs.log('new date is: ' +  newdate);
        	gr.state = '3';
        	gr.work_start = newdate;
                gr.work_end = newdate;
                gr.update();
}


///---------------------- CANCEL CHANGE TASKS FOR MULTIPLE CHANGE REQUESTS ---------------------------///

var change_arr = ['CHG0040003', 'CHG0040005', 'CHG0040006']; //Iterate through the changes that need their change tasks to be cancelled

for (var i=0; i < change_arr.length; i++){
	
	// UPDATE CHANGE TASK
	var gr = new GlideRecord('change_task');
	gr.change_request = getSysid(change_arr[i]);
	while(grt.next()) {
		if (grt.state != 4) {
			grt.state = 4;
			grt.update();
	}
}

function getSysid(num){

	// get the sys_id for a change request item
	var chg = new GlideRecord('change_request');
	chg.addQuery('number', num);
	chg.query();

	if(chg.next()){
		return chg.sys_id;
	}
		return '';
}


///---------------------- CANCEL CASE CS1511348 ---------------------------///

var gr = new GlideRecord('sn_customerservice_case');
gr.addEncodedQuery('active=true^state=10^number=CS1511348');
gr.query();
gs.log('Number of cases: ' +  gr.getRowCount());
gs.log('Case number: ' + gr.number());
if (gr.next()) {
    gs.log(gr.number + '\n');   
    gr.state = '7';
    gr.update();
}
	

///---------------------- CLOSE ACTIVE RITMS THAT ARE CLOSED COMPLETE ---------------------------///

closeItems();
function closeItems(){
	var str = "state=3^active=true";
	var req = new GlideRecord('sc_req_item');
	req.addEncodedQuery(str);
	req.query();
	while(req.next()){
		req.active = false;
		req.setWorkflow(false);
		req.update();
	}
}
// source: https://community.servicenow.com/community?id=community_question&sys_id=78265421dbec44dc0be6a345ca9619d3&view_source=searchResult


///---------------------- DELETE MULTIPLE RECORDS ---------------------------///

// template delete multiple records 
var grRu = new GlideRecord('u_integration_subscription');
grRu.addEncodedQuery("your query");
grRu.query();
grRu.deleteMultiple();
	
// e.g. delete multiple records of departments that have been created TODAY
var gr = new GlideRecord('cmn_department');
gr.addEncodedQuery('sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()');
gr.query();
gs.log('Number of depts deleted: ' +  gr.getRowCount());
gr.deleteMultiple();


