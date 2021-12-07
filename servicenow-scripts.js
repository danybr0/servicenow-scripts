// example
var target = new GlideRecord('incident'); 
target.addQuery('priority',1);
target.query(); // Issue the query to the database to get relevant records 
while (target.next()) { 
  // add code here to process the incident record 
}

// display value of a field
// For regular forms, use this:
var disp = g_form.getDisplayBox("field_name").value;
// In the Service Catalog, you may have to use this instead:
var varDisp = g_form.getDisplayBox(g_form.resolveNameMap("variable_name")).value;


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


// DELETE MULTIPLE RECORDS 
// e.g. delete multiple records of departments that have been created TODAY
var gr = new GlideRecord('cmn_department');
gr.addEncodedQuery('sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()');
gr.query();

gs.log('Number of depts deleted: ' +  gr.getRowCount());

while (gr.next()) {
   gr.deleteMultiple();
}

