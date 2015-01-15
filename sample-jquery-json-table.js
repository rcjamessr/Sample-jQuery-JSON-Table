//sample-jquery-json-table.js
function formatUsDollar(name) {
    var cents = 0;
    var part = "";
    var obj = $(name);
    if (obj.val().split(".").length < 2) {
        obj.val(obj.val().split(".")[0] + ".00");
    } else {
        part = obj.val().split(".")[1];
        if (part.length == 1) {
            cents = parseInt(obj.val().split(".")[1]) * 10;
        } else {
            cents = parseInt(obj.val().split(".")[1]);
        }

        if (cents < 10) {
            obj.val(obj.val().split(".")[0] + ".0" + cents);
        } else {
            obj.val(obj.val().split(".")[0] + "." + cents);
        }
    }
}
function get_json_controller(controller_name) {
    return {
        name: controller_name,
        parent: "",                    //this should be the id of the input that holds parent id value
        table_id: "",                  // this should be the id of the table that displays/captures the data
        data_columns: [],               // example: ['"Id"', '"FirstName"', '"LastName"']
        data_controls: [],               // example: ['"input"', '"input"', '"input"']
        data_source_url: "",
        data_update_url: "",
        data_delete_url: "",
        data_create_url: "",
        parent_id: 0,
        row_count: 0,
        data_format_function: [],
        data_table_id: function () { return "#" + this.table_id + " tbody"; },
        parent_dom_ref: function () { return "#" + this.parent; },
        load_data: function () {
            this.parent_id = $(this.parent_dom_ref()).val();
            var controller = this;
            $.ajax({
                type: "GET",
                cache: false,
                dataType: "json",
                data: { id: controller.parent_id },
                url: this.data_source_url,
                success: function (obj) {
                    var columns = controller.data_columns;
                    var controls = controller.data_controls;
                    var formatter = controller.data_format_function;
                    $(controller.data_table_id()).empty();
                    var rowCount = 0;
                    $.each(obj,
                        function (index, value) {
                            $row = $("<tr/>");
                            $.each(columns, function (index_col) {
                                //TODO: proper formatting needs to be implemented here
                                var column = eval(columns[index_col]);
                                var ret_object = eval("value." + column);
                                $col = $("<td />");
                                var type = column == "Id" ? "hidden" : "text";
                                if(controls.length!=0){
                                    controls[index_col].clone(true).val(ret_object).appendTo($col);
                                    controls[index_col].change(formatter[index_col]);
                                } else {
                                    $col.text(ret_object);
                                }
                                $($col).appendTo($row);
                            });
                            if (controller.data_delete_url.length != 0) {
                                $col = $("<td/>");
                                $("<a href='javascript:" + controller.name + ".delete_data(" + value.Id + ");'>Delete</a>").appendTo($col);
                                $($col).appendTo($row);
                            }
                            $($row).appendTo(controller.data_table_id());
                            rowCount++;
                        }
                    );
                    controller.row_count = rowCount;
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    //alert('error = ' + xhr.responseText);
                    alert('Error with ' + controller.name + ':An error occurred calling load_data');
                }
            });
        },
        update_data: function (andAdd) {
            var controller = this;
            this.parent_id = $(this.parent_dom_ref()).val();
            if (this.row_count == 0) return;
            $IDS = $(this.data_table_id() + " input, select");
            var jsonString = '{"' + this.parent + '":' + this.parent_id;
            var col_strings = [];
            var columns = this.data_columns;
            $.each(columns, function (index_cols) {
                col_strings[index_cols] = ',' + columns[index_cols] + ':[';
                $.each($IDS, function (index, value) {
                    var col_name = eval(columns[index_cols]);
                    if (value.id == col_name)
                        col_strings[index_cols] = col_strings[index_cols] + '"' + value.value + '"' + ",";
                });
                col_strings[index_cols] = col_strings[index_cols].substr(0, col_strings[index_cols].length - 1) + "]";
            });
            $.each(col_strings, function (index) {
                jsonString = jsonString + col_strings[index];
            });
            jsonString = jsonString + "}";
            var jsonData = jQuery.parseJSON(jsonString);
            $.ajax({
                type: "POST",
                cache: false,
                url: this.data_update_url,
                data: jsonData,
                success: function (obj) {
                    if (andAdd == 1) {
                        controller.create_data();
                    } else {
                        controller.load_data();
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    //alert('error = ' + xhr.responseText);
                    alert('Error with ' + controller.name + ':An error occurred calling update_data');
                }
            });
        },
        delete_data: function (Id) {
            var controller = this;
            $.ajax({
                type: "GET",
                cache: false,
                url: controller.data_delete_url,
                data: { id: Id },
                success: function (obj) {
                    controller.row_count = controller.row_count - 1;
                    controller.load_data();
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    //alert('error = ' + xhr.responseText);
                    alert('Error with ' + controller.name + ':An error occurred calling delete_data');
                }
            });
        },
        create_data: function () {
            var controller = this;
            $.ajax({
                type: "GET",
                cache: false,
                url: controller.data_create_url,
                data: { id: controller.parent_id },
                success: function (obj) {
                    controller.load_data();
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    //alert('error = ' + xhr.responseText);
                    alert('Error with ' + controller.name + ':An error occurred calling create_data');
                }
            });
        },
        add_row: function () {
            this.parent_id = $(this.parent_dom_ref()).val();
            if (this.row_count == 0) {
                this.create_data();
            } else {
                this.update_data(1);
            }
        }
    };
}
