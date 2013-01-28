var DirectedAcyclicGraphHistory = function() {
    
    var history = History();
    
    history.addSelection = function(d, name) {
        if (d.length == 0) {
            return;
        }
        
        var item = {};
        
        item.apply = function() {
            d.forEach(function(e) { e.visible = false; });
        }
        
        item.unapply = function() {
            d.forEach(function(e) { e.visible = true; });
        }
        
        item.name = name;
        item.selection = d;
        
        history.add(item);
    }
    
    history.addSelected = function(graphSVG) {
        var selection = [];
        graphSVG.selectAll(".node.selected").each(function(d) {
            selection.push(d);
        });
        
        history.addSelection(selection, "User Selection");
    }
    
    return history;
}

var History = function() {
    
    var seed = 0;    
    var history = [];
    
    history.add = function(item) {
        item.id = seed++;
        history.splice(0, 0, item);
        item.apply();
    }
    
    history.remove = function(item) {
        var i = history.indexOf(item);
        if (i!=-1) {
            history.splice(i, 1);
        }
        item.unapply();
        for (var i = 0; i < history.length; i++) {
            history[i].apply();
        }
    }
    
    return history;
}