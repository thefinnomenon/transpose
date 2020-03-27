//
//  ShareViewController.swift
//  shareExtension
//
//  Created by Chris Finn on 3/27/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import UIKit
import Social
import SafariServices
import MobileCoreServices

class ShareViewController: SLComposeServiceViewController {

    override func isContentValid() -> Bool {
        return true
    }
  
    override func viewDidLoad() {
      didSelectPost()
    }

    override func didSelectPost() {
        if let item = extensionContext?.inputItems.first as? NSExtensionItem {
          if let attachments = item.attachments {
            for attachment: NSItemProvider in attachments {
              if attachment.hasItemConformingToTypeIdentifier("public.url") {
                attachment.loadItem(forTypeIdentifier: "public.url", options: nil, completionHandler: { (url, error) in
                  if let shareURL = url as? NSURL {
                    let url = NSURL(string: "transpose://\(shareURL)")
                    let selectorOpenURL = sel_registerName("openURL:")
                    let context = NSExtensionContext()
                    context.open(url! as URL, completionHandler: nil)
                    var responder = self.parent as UIResponder?
                    while (responder != nil){
                      if responder?.responds(to: selectorOpenURL) == true{
                        responder?.perform(selectorOpenURL, with: url)
                      }
                      responder = responder!.next
                    }
                  }
                  self.extensionContext?.completeRequest(returningItems: [], completionHandler:nil)
                  //super.didSelectCancel()
                })
              }
            }
          }
        }
    }
  
    override func didSelectCancel() {
      super.didSelectCancel()
    }
}
