const mysql = require("mysql");
const cTable = require("console.table");
const inquirer = require ("inquirer"); 

const connection = mysql.createConnection({
  host: "localhost",
  // Your port;
  port: 3306,

  // Your username
  user: "root",
  password: "Laurel_196",
  database: "employee_DB"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId + "\n");
  start();
});

function start(){
  inquirer
  .prompt({
    name: "Directory",
    type: "list",
    message: "What would you like to do?",
    choices:["Add","View","Delete","Update","Exit"]
  }
  ).then(function ({ Directory }) {
    switch (Directory) {
        case 'Add':
            addData();
            break;
        case 'View':
            viewData();
            break;
        case 'Update':
            updateData();
            break;
        case 'Delete':
            deleteData()
            break;
        case 'Exit':
            connection.end()
            return;
    }
  });
}

function addData(){
  inquirer
    .prompt({
      name: "db",
      type: "list",
      message: "What would you like to add?",
      choices: ['department', 'roles', 'employee'],
    })
    .then(function({db}) {
      switch (db) {
        case 'department':
          add_department();
          break;
        case 'roles':
          add_role();
          break;
        case 'employee':
          add_employee();
          break;
      }
    });
}

function add_department(){
  inquirer
  .prompt({
    name: 'name',
    message: 'What is the name of the department?',
    type: 'input'
  })
  .then(function({name}){
    connection.query(`INSERT INTO department (name) VALUES ('${name}')`, function(err, res){
      if (err) throw err;
      console.log(`Added`)
      start();
    })
  })
}

function add_role() {
  let departments = []
  connection.query(`SELECT * FROM department`, function (err, data) {
    if (err) throw err;

    for (let i = 0; i < data.length; i++) { // Loops through and finds the name of all the departments
        departments.push(data[i].name)

    }

    inquirer
      .prompt([
        {
          type: "input", 
          name: "title",
          message: "What role would you like to add?"
        },
        {
          type: "input",
          name: "salary",
          message: "What is the salary for the role?"
        },
        {
          type: "list",
          name: "department",
          message: "Which department does this role belong to?",
          choices: departments
        }
    ]).then(function ({ title, salary, department_id }) {
      let index = departments.indexOf(department_id)

      connection.query(`INSERT INTO roles (title, salary, department_id) VALUES ('${title}', '${salary}', ${index})`, function (err, data) {
          if (err) throw err;
          console.log(`Added`)
          start();
      })
    })
  })
}

function add_employee() {
  let employees = [];
  let roles = [];

  connection.query(`SELECT * FROM roles`, function (err, data) {
      if (err) throw err;


      for (let i = 0; i < data.length; i++) {
          roles.push(data[i].title);
      }

      connection.query(`SELECT * FROM employee`, function (err, data) {
          if (err) throw err;

          for (let i = 0; i < data.length; i++) {
              employees.push(data[i].first_name);
          }

          inquirer
              .prompt([
                  {
                      name: 'first_name',
                      message: "what's the employees First Name",
                      type: 'input'
                  },
                  {
                      name: 'last_name',
                      message: 'What is their last name?',
                      type: 'input',
                  },
                  {
                      name: 'role_id',
                      message: 'What is their role?',
                      type: 'list',
                      choices: roles,
                  },
                  {
                      name: 'manager_id',
                      message: "Who is their manager?",
                      type: 'list',
                      choices: ['none'].concat(employees)
                  }
              ]).then(function ({ first_name, last_name, role_id, manager_id }) {
                  let queryText = `INSERT INTO employee (first_name, last_name, role_id`;
                  if (manager_id != 'none') {
                      queryText += `, manager_id) VALUES ('${first_name}', '${last_name}', ${roles.indexOf(role_id)}, ${employees.indexOf(manager_id) + 1})`
                  } else {
                      queryText += `) VALUES ('${first_name}', '${last_name}', ${roles.indexOf(role_id) + 1})`
                  }
                  console.log(queryText)

                  connection.query(queryText, function (err, data) {
                      if (err) throw err;

                      start();
                  })
              })

      })
  })
}

function viewData(){
  inquirer
        .prompt(
            {
                name: "db",
                message: 'Which would you like to view?',
                type: 'list',
                choices: ['department', 'role', 'employee'],
            }
        ).then(function ({ db }) {
            connection.query(`SELECT * FROM ${db}`, function (err, data) {
                if (err) throw err;

                console.table(data)
                start();
            })
        })
}

function updateData() {
  inquirer
      .prompt(
          {
              name: 'update',
              message: 'What would you like to update?',
              type: 'list',
              choices: ['role', 'manager']
          }
      ).then(function ({ update }) {
          switch (update) {
              case 'role':
                  update_role();
                  break;
              case 'manager':
                  update_manager();
                  break;
          }
      })
}

function update_role() {
  connection.query(`SELECT * FROM employee`, function (err, data) {
      if (err) throw err;

      let employees = [];
      let roles = [];

      for (let i = 0; i < data.length; i++) {
          employees.push(data[i].first_name)
      }

      connection.query(`SELECT * FROM role`, function (err, data) {
          if (err) throw err;

          for (let i = 0; i < data.length; i++) {
              roles.push(data[i].title)
          }

          inquirer
              .prompt([
                  {
                      name: 'employee_id',
                      message: "Who's role needs to be updated",
                      type: 'list',
                      choices: employees
                  },
                  {
                      name: 'role_id',
                      message: "What is the new role?",
                      type: 'list',
                      choices: roles
                  }
              ]).then(function ({ employee_id, role_id }) {
                  //UPDATE `table_name` SET `column_name` = `new_value' [WHERE condition]
                  connection.query(`UPDATE employee SET role_id = ${roles.indexOf(role_id) + 1} WHERE id = ${employees.indexOf(employee_id) + 1}`, function (err, data) {
                      if (err) throw err;

                      start();
                  })
              })
      })

  })
}

function update_manager() {
  connection.query(`SELECT * FROM employee`, function (err, data) {
      if (err) throw err;

      let employees = [];

      for (let i = 0; i < data.length; i++) {
          employees.push(data[i].first_name)
      }

      inquirer
          .prompt([
              {
                  name: 'employee_id',
                  message: 'Who would you like to update?',
                  type: 'list',
                  choices: employees
              },
              {
                  name: "manager_id",
                  message: "Who's their new manager?",
                  type: 'list',
                  choices: ['none'].concat(employees)
              }
          ]).then(({ employee_id, manager_id }) => {
              let queryText = ""
              if (manager_id !== "none") {
                  queryText = `UPDATE employee SET manager_id = ${employees.indexOf(manager_id) + 1} WHERE id = ${employees.indexOf(employee_id) + 1}`
              } else {
                  queryText = `UPDATE employee SET manager_id = ${null} WHERE id = ${employees.indexOf(employee_id) + 1}`
              }

              connection.query(queryText, function (err, data) {
                  if (err) throw err;

                  start();
              })

          })

  });
}