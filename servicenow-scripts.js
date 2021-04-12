// example
var target = new GlideRecord('incident'); 
target.addQuery('priority',1);
target.query(); // Issue the query to the database to get relevant records 
while (target.next()) { 
  // add code here to process the incident record 
}

// update INC/problem/change request
var gr = new GlideRecord('change_task');
	gr.addQuery('number', 'CTASK0111702');
	gr.query();
	if(gr.next()) {
           gr.state = '4';
           gr.update();
}
