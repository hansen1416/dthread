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
        Err(e) => {

        }
    }
}



