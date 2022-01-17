fn main() {
    let arr: [u8; 4] = [1, 2, 3, 4];
    let tt = 30;

    let shar = tt / (arr.len() - 1);

    println!("{}, {}", tt, shar);

    for i in 0..arr.len() {
        println!("{}", i);
    }
}
