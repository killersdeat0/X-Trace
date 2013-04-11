function WeisfeilerLehmanKernel(/*optional*/ depth, /*optional*/ kernel) {
    this.depth = (depth && depth > 0) ? depth : 20;
    this.kernel = kernel ? kernel : new NodeCountKernel();
    
    var generator = new WLMultisetLabelGenerator();
    
    var relabel = function(graph, reverse) {
        // Create a new graph for the relabelling
        var next = graph.clone();
        
        // Relabel the nodes in the new graph, based on their neighbours in the old graph
        graph.get_nodes().forEach(function(node) {
            var neighbours = reverse ? graph.get_parent_labels(node) : graph.get_child_labels(node);
            next.relabel(node.id, generator.relabel(node.label, neighbours));
        });
        
        // Any node in the old graph that has no neighbours should be removed from the new graph
        graph.get_nodes().forEach(function(node) {
            var neighbours = reverse ? graph.get_parent_ids(node.id) : graph.get_child_ids(node.id);
            if (neighbours.length==0) next.remove(node.id);
        });

        return next;
    }
    
    this.calculate = function(a, b) {
        return (this.calculate_forwards(a, b) + this.calculate_backwards(a, b)) / 2;
    }
    
    this.calculate_forwards = function(a, b) {
        return this.do_calculate(a, b, false);        
    }
    
    this.calculate_backwards = function(a, b) {
        return this.do_calculate(a, b, true);
    }
    
    this.do_calculate = function(a, b, reverse) {
        var score = this.kernel.calculate(a, b);
        for (var i = 1; i < this.depth; i++) {
            a = relabel(a, reverse);
            b = relabel(b, reverse);
            score += this.kernel.calculate(a, b);
        }
        return score;        
    }
    
    this.calculate_node_stability = function(a, b) {        
        var labels_a = {}, labels_b = {}; // For each node, keeps track of all the labels that get assigned to it for all iterations
        var scores_a = {}, scores_b = {}; // Counts the number of times a node's label exists in both graphs
        
        // Initialize values with all node ids
        a.get_node_ids().forEach(function(id) { labels_a[id] = []; scores_a[id] = 0; });
        b.get_node_ids().forEach(function(id) { labels_b[id] = []; scores_b[id] = 0; });
        
        for (var i = 0; i < this.depth; i++) {
            // Update the scores for labels that occur in both graphs
            var la = a.get_labels(), lb = b.get_labels();
            a.get_labels().forEach(function(label) {
                var score = b.get_label_count(label) / a.get_label_count(label);
                if (score > 1) score = 1/score;
                a.get_node_ids_for_label(label).forEach(function(id) {
                    labels_a[id].push(label); // Save each node's labels from this round
                    scores_a[id] += score;    // Update each node's aggregate score
                })
            });
            b.get_labels().forEach(function(label) {
                var score = a.get_label_count(label) / b.get_label_count(label);
                if (score > 1) score = 1/score;
                b.get_node_ids_for_label(label).forEach(function(id) {
                    labels_b[id].push(label); // Save each node's labels from this round
                    scores_b[id] += score;    // Update each node's aggregate score
                })
                
            })
            
            // Relabel the graph for the next round
            a = relabel(a);
            b = relabel(b);
        }
        return [{"labels": labels_a, "scores": scores_a}, {"labels": labels_b, "scores": scores_b}];
    }
}

WeisfeilerLehmanKernel.prototype = new Kernel();

function WLMultisetLabelGenerator() {
    this.labels = {};
    this.seed = 0;
}

WLMultisetLabelGenerator.prototype.next = function() {
    return this.seed++;
}

WLMultisetLabelGenerator.prototype.relabel = function(label, /*optional*/neighbour_labels) {
    if (!neighbour_labels) neighbour_labels = [];
    
    // First, figure out the label, making sure neighbours are sorted
    var canonical_label = label+":"+neighbour_labels.sort().join(",");
    
    // Now relabel this label if it hasn't already been relabelled
    if (!this.labels.hasOwnProperty(canonical_label)) { 
        this.labels[canonical_label] = this.next();
    }
    
    return this.labels[canonical_label];
}