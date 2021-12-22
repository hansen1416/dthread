fn main() {
    // println!("Hello, world!");
    let mut arguments = std::env::args().skip(1);
    let key = arguments.next().expect("key was not there");
    let value = arguments.next().unwrap();
    println!("The key is '{}' and the value is '{}'", key, value);

    let contents = format!("{}\t{}\n", key, value);
    // File will look like this
    // mykey\tmyvalue\nmykey2\tmyvalue2

    //let write_result = std::fs::write("kv.db", contents).unwrap(); //if it goes wrong, just crush the program

    let write_result = std::fs::write("kv.db", contents);

    // Result<(), Error>, empty tuple (void), or error

    // you never catch a panic, if your program panic, it will crush

    // pattern matching, similar as `switch`, but better?
    match write_result {
        Ok(()) => {

        }
        Err(_e) => {

        }
    }

    let database = Database::new().expect("Database::new() crushed");

    // println!("{}", database)
}

// in struct, add fields,
struct Database {
    // field1: String,
    // field2: u8,
    map: std::collections::HashMap<String, String>,
}

// in implementation, add methods
impl Database {

    fn new() -> Result<Database, std::io::Error> {
        // read the kv.db file
        
        // let content = match std::fs::read_to_string("kv.db") {
        //     Ok(contents) => {
        //         contents; // ignore return on the last thing
        //     }
        //     Err(error) => {
        //         return Result::Err(error);
        //     }
        // };

        // ? euqal to error handling, if there is an error, return the error

        // Rust a operating system language, doesn't have garbage colector, it has ownership

        // you can never have refernce to something that is dropped, which called dangling pointer in c++

        let mut map = std::collections::HashMap::new();

        let content = std::fs::read_to_string("kv.db")?;

        for line in content.lines() {
            // ' is char, " is string
            let (key, value) = line.split_once('\t').expect("Corrupt database");
            // call to_owned() copy the memory, transfer the ownership, 
            // so the type is String instead of &str
            map.insert(key.to_owned(), value.to_owned());

            println!("key is {}, value is {}", key, value)
        }

        // parse the string
        Result::Ok(Database {map: map})
    }


}

