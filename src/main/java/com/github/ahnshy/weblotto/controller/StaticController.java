package com.github.ahnshy.weblotto.controller;

import com.github.ahnshy.weblotto.model.Repository.LotteryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/static") // localhost:8080/api/static
public class StaticController {

    @Autowired
    private LotteryRepository lotteryRepository;

//    @GetMapping("/sum")
//    public HashMap<int, int> mapSum() {
//    }

//    @GetMapping("/month")
//    public HashMap<int, int> mapMonth {
//    }
}
