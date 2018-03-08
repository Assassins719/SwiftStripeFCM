//
//  CardFieldViewController.swift
//  UI Examples
//
//  Created by Ben Guo on 7/19/17.
//  Copyright © 2017 Stripe. All rights reserved.
//

import UIKit
import Stripe

protocol CardFieldViewDelegate{
    func didFinishCardView(_ strToken:String)
}

class CardFieldViewController: UIViewController {

    let cardField = STPPaymentCardTextField()   //Card Input Field
    var theme = STPTheme.default()              //UI Theme(Default)
    
    var alert = UIAlertController(title: nil, message: "Please wait...", preferredStyle: .alert)    //Loading dialog while getting token
    let loadingIndicator = UIActivityIndicatorView(frame: CGRect(x: 10, y: 5, width: 50, height: 50))
    
    var delegate:CardFieldViewDelegate! = nil
    
    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Card Field"
        view.backgroundColor = UIColor.white
        view.addSubview(cardField)
        edgesForExtendedLayout = []
        view.backgroundColor = theme.primaryBackgroundColor
        cardField.backgroundColor = theme.secondaryBackgroundColor
        cardField.textColor = theme.primaryForegroundColor
        cardField.placeholderColor = theme.secondaryForegroundColor
        cardField.borderColor = theme.accentColor
        cardField.borderWidth = 1.0
        cardField.textErrorColor = theme.errorColor
        cardField.postalCodeEntryEnabled = true
        navigationItem.leftBarButtonItem = UIBarButtonItem(barButtonSystemItem: .done, target: self, action: #selector(done))
        navigationController?.navigationBar.stp_theme = theme
        
        // Init loading dialog
        loadingIndicator.hidesWhenStopped = true
        loadingIndicator.activityIndicatorViewStyle = UIActivityIndicatorViewStyle.gray
        loadingIndicator.startAnimating();
        alert.view.addSubview(loadingIndicator)
    }

    @objc func done() { //If press "Done"
        present(self.alert, animated: true, completion: nil)
        let card = cardField.cardParams
        print("card");
        print(card)
        
        STPAPIClient.shared().createToken(withCard: card, completion: {(token, error) -> Void in
            self.alert.dismiss(animated: false, completion: nil)    //Dismiss loading
            if let error = error {
                let alert = UIAlertController(title: "Alert", message: "Wrong Card Info", preferredStyle: UIAlertControllerStyle.alert)
                alert.addAction(UIAlertAction(title: "Input Again", style: UIAlertActionStyle.default, handler: nil))
                self.present(alert, animated: true, completion: nil)
                print(error)
            }
            else if let token = token {
                self.delegate.didFinishCardView(token.stripeID)
                self.dismiss(animated: true, completion: nil)
            }
        })
        //
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        cardField.becomeFirstResponder()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        let padding: CGFloat = 15
        cardField.frame = CGRect(x: padding,y: padding,width: view.bounds.width - (padding * 2),height: 50)
    }
}
