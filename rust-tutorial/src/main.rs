// String Methods

fn main() {
    //replace
    {
        let my_s = String::from("some string");
        println!("After replace: {}", my_s.replace("some", "a"));
    }

    //lines
    {
        let my_s = String::from("some string\n a\n b\n c\n d");
        for l in my_s.lines() {
            println!("{}", l);
        }
    }

    // Split
    {
        let my_s = String::from("a+b+c+d+f+g+h+j+k");

        let tokens: Vec<&str> = my_s.split("+").collect();

        println!("at index 2 {}", tokens[2]);
    }

    //trim
    {
        let my_s = String::from("    a+b+c+d+f+g+h+j+k    ");

        println!("before trim {}", my_s);
        println!("after trim {}", my_s.trim());
    }

    //chars
    {
        let my_s = String::from("a+b+c+d+f+g+h+j+k");

        /* get character at index */
        match my_s.chars().nth(55) {
            Some(c) => {
                println!("char at index 5 {}", c);
            }
            None => {
                println!("no char at index 5");
            }
        }
    }
}
