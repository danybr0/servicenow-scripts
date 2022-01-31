// GET the the value of a field
// For regular forms, use this:
var disp = g_form.getDisplayBox("field_name").value;
// In the Service Catalog, you may have to use this instead:
var varDisp = g_form.getDisplayBox(g_form.resolveNameMap("variable_name")).value;

///////////////////////// GLIDERECORD SCRIPTS

// example
var target = new GlideRecord('incident'); 
target.addQuery('priority',1);
target.query(); // Issue the query to the database to get relevant records 
while (target.next()) { 
  // add code here to process the incident record 
}

// CANCEL CASES 
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


// Bulk amendment of a specific SLA Definition

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

// UPDATE RITM / SRQ
var gr = new GlideRecord('sc_req_item');
gr.addQuery('number', 'RITM0040224'); // ritm number
gr.query();
if(gr.next()) {
   gr.state = '8';
   gr.update();
}


//  Change Closure Code in Change Request
var gr = new GlideRecord('change_request');
gr.addQuery('number', 'CHG0069215');
gr.query();

while(gr.next()){
gr.u_qs_closure_code = '5';
gr.update();
} 


// CHANGE STATE IN CHANGE REQUEST 
var gr = new GlideRecord('change_request');
gr.addQuery('number', 'CHG0042583');
gr.query();
if(gr.next()) {
   gr.state = '308';          //308 CANCELLED
   gr.update();
}


// UPDATE CHANGE TASK
var gr = new GlideRecord('change_task');
gr.addQuery('number', 'CTASK0111702');
gr.query();
if(gr.next()) {
   gr.state = '4';
   gr.update();
}

// UPDATE CHANGE TASK EX2
if(current.number == 4){
	var gr = new GlideRecord('change_task');
	gr.addQuery('change_request.number', current.number); // g_form.GetValue only works on client scripts and br's run on the server.. so you can't use g_form, instead use current.number
	gr.query();
	while(gr.next()) {
           gr.state = '4';
           gr.update();
	}
}


// CREATE CHANGE TASKS FOR A SINGLE CHANGE REQUEST
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


// CREATE CHANGE TASKS FOR MULTIPLE CHANGE REQUESTS
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

// CANCEL CHANGE TASKS FOR A SINGLE CHANGE REQUEST
var grt = new GlideRecord('change_task');
grt.addQuery('change_request', 'eaf5d21347c12200e0ef563dbb9a7109');
grt.query();
while(grt.next()) {
	if (grt.state != 4) {
		grt.state = 4;
		grt.update();
	}
}

// CANCEL CHANGE TASKS FOR A SINGLE CHANGE REQUEST
var gr = new GlideRecord('change_task');
	gr.addQuery('change_request', '4e2b3e895f7e289864d574a460069cdd');
        gr.addEncodedQuery('stateIN-5,1,2');
        gr.orderBy('order');
	gr.query();
        gs.log('change task count is: ' +  gr.getRowCount());
	while(gr.next()) {
        gs.log(gr.number + '\n');
        gr.state = '4';
        gr.update();
}

// CLOSE CHANGE TASKS FOR A SINGLE CHANGE REQUEST
var gr = new GlideRecord('change_task');
    gr.addQuery('change_request', '1c4064495f037c9064d574a460069ce5'); // sys_id
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
        gr.work_end = newdate;
        gr.update();
}

// CANCEL CHANGE TASKS FOR A SINGLE CHANGE REQUEST (+ value WORK START AND WORK END)
var gr = new GlideRecord('change_task');
	gr.addQuery('change_request', '3e3d586a5f4d74dc64d574a460069cab');
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

// CANCEL CHANGE TASKS FOR MULTIPLE CHANGE REQUESTS
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

// UPDATE CS1511348 to state 7 (cancelled) 
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
	
// CLOSE active RITMS that are Closed Complete state
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

// DELETE MULTIPLE RECORDS 
// e.g. delete multiple records of departments that have been created TODAY
var gr = new GlideRecord('cmn_department');
gr.addEncodedQuery('sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()');
gr.query();

gs.log('Number of depts deleted: ' +  gr.getRowCount());

while (gr.next()) {
   gr.deleteMultiple();
}

